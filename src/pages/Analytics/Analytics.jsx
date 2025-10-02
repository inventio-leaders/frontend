import React, { useMemo, useRef, useState, useEffect } from "react";
import styles from "./Analytics.module.scss";
import {
  useListAnomaliesQuery,
  useCountAnomaliesQuery,
} from "../../api/anomaliesApi";
import {
  useListForecastsQuery,
  useCountForecastsQuery,
} from "../../api/forecastsApi";
import { useListModelsQuery, useCountModelsQuery } from "../../api/modelsApi";
import { useLazyExportProcessedToXlsxQuery } from "../../api/processedDataApi";
import {
  useTrainMutation,
  useRunForecastMutation,
  useAnomalyScanMutation,
  useLazyTaskStatusQuery,
} from "../../api/mlApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ---- helpers ----
const pad2 = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;

// input datetime-local → добавляем секунды
const toNaiveLocalISO = (s) =>
  s && s.length === 16 ? `${s}:00` : s || undefined;

export default function Analytics() {
  // дефолтный период: апрель 2025
  const defaultFrom = new Date("2025-04-03T00:00:00");
  const defaultTo = new Date("2025-05-03T00:00:00");

  const [dtFrom, setDtFrom] = useState(toLocalInput(defaultFrom));
  const [dtTo, setDtTo] = useState(toLocalInput(defaultTo));
  const [thresholdPct, setThresholdPct] = useState(10);
  const [saveToDb, setSaveToDb] = useState(true);

  const paramsRange = useMemo(
    () => ({
      dt_from: toNaiveLocalISO(dtFrom),
      dt_to: toNaiveLocalISO(dtTo),
      order_desc: false,
      limit: 500,
    }),
    [dtFrom, dtTo]
  );

  // ---- данные ----
  const { data: anomalies = [] } = useListAnomaliesQuery(paramsRange);
  const { data: forecasts = [] } = useListForecastsQuery(paramsRange);
  const { data: models = [] } = useListModelsQuery();

  const { data: anomaliesCount } = useCountAnomaliesQuery(paramsRange);
  const { data: forecastsCount } = useCountForecastsQuery(paramsRange);
  const { data: modelsCount } = useCountModelsQuery();

  // ---- экспорт processed→xlsx ----
  const [triggerExport, { isFetching: exporting }] =
    useLazyExportProcessedToXlsxQuery();

  const onExport = async () => {
    try {
      const res = await triggerExport({
        dt_from: paramsRange.dt_from,
        dt_to: paramsRange.dt_to,
        threshold_pct: Number(thresholdPct),
        save_to_db: !!saveToDb,
        filename: "processed_anomalies.xlsx",
      }).unwrap();

      if (res instanceof Blob) {
        const url = URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = "processed_anomalies.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        alert("Готово: " + JSON.stringify(res));
      }
    } catch (e) {
      console.error(e);
      alert("Экспорт не удался");
    }
  };

  // ---- ML задачи ----
  const [train, { isLoading: training }] = useTrainMutation();
  const [runForecast, { isLoading: forecasting }] = useRunForecastMutation();
  const [anomalyScan, { isLoading: scanning }] = useAnomalyScanMutation();
  const [fetchTaskStatus] = useLazyTaskStatusQuery();

  const [tasks, setTasks] = useState([]); // {task_id, type, status}
  const tasksRef = useRef(null);

  const scrollToTasks = () => {
    setTimeout(() => {
      tasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const pushTask = (task, type) => {
    setTasks((prev) => [{ ...task, type }, ...prev]);
    scrollToTasks();
  };

  const handleTrain = async () => {
    try {
      const task = await train({
        narx: true,
        ae: true,
        window: 24,
        ae_threshold_percentile: 99,
      }).unwrap();
      pushTask(task, "train");
    } catch {
      alert("Ошибка обучения");
    }
  };

  const handleRunForecast = async () => {
    try {
      const task = await runForecast({ horizon_hours: 48 }).unwrap();
      pushTask(task, "forecast");
    } catch {
      alert("Ошибка прогноза");
    }
  };

  const handleScanAnomaly = async () => {
    try {
      const task = await anomalyScan({
        from_dt: toNaiveLocalISO(dtFrom),
        to_dt: toNaiveLocalISO(dtTo),
      }).unwrap();
      pushTask(task, "anomaly_scan");
    } catch {
      alert("Ошибка сканирования");
    }
  };

  const refreshTask = async (idx) => {
    const t = tasks[idx];
    try {
      const updated = await fetchTaskStatus(t.task_id).unwrap();
      setTasks((arr) =>
        arr.map((x, i) => (i === idx ? { ...x, ...updated } : x))
      );
    } catch {}
  };

  // авто-обновление задач каждые 5 сек
  useEffect(() => {
    if (!tasks.length) return;
    const interval = setInterval(async () => {
      await Promise.all(tasks.map((_, idx) => refreshTask(idx)));
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  // ---- подготовка графиков ----
  const anomaliesByDay = useMemo(() => {
    const map = new Map();
    anomalies.forEach((a) => {
      const d = new Date(a.datetime);
      const k = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )}`;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
  }, [anomalies]);

  const forecastSeries = useMemo(() => {
    return forecasts.map((f) => ({
      time: new Date(f.datetime).toLocaleString(),
      predicted: parseFloat(f.predicted_consumption_gvs),
      conf:
        f.confidence_score != null ? parseFloat(f.confidence_score) : undefined,
    }));
  }, [forecasts]);

  // ---- render ----
  return (
    <div className={styles.page}>
      {/* фильтры */}
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label>С даты</label>
          <input
            type="datetime-local"
            value={dtFrom}
            onChange={(e) => setDtFrom(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>По дату</label>
          <input
            type="datetime-local"
            value={dtTo}
            onChange={(e) => setDtTo(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Порог отклонения, %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={thresholdPct}
            onChange={(e) => setThresholdPct(e.target.value)}
          />
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={saveToDb}
            onChange={(e) => setSaveToDb(e.target.checked)}
          />
          Сохранять аномалии в БД
        </label>

        <button className={styles.btn} onClick={onExport} disabled={exporting}>
          {exporting ? "Экспорт..." : "Экспорт/расчёт аномалий (XLSX)"}
        </button>
        <button
          className={styles.btn}
          onClick={handleScanAnomaly}
          disabled={scanning}
        >
          {scanning ? "Сканирую..." : "Сканировать аномалии (ML)"}
        </button>
        <button
          className={styles.btn}
          onClick={handleRunForecast}
          disabled={forecasting}
        >
          {forecasting ? "Запуск..." : "Запустить прогноз (ML)"}
        </button>
        <button
          className={styles.btn}
          onClick={handleTrain}
          disabled={training}
        >
          {training ? "Обучаю..." : "Обучить модель (ML)"}
        </button>
      </div>

      {/* summary */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <strong>Аномалий:</strong>{" "}
          {typeof anomaliesCount === "number" ? anomaliesCount : "—"}
        </div>
        <div className={styles.card}>
          <strong>Прогнозов:</strong>{" "}
          {typeof forecastsCount === "number" ? forecastsCount : "—"}
        </div>
        <div className={styles.card}>
          <strong>Моделей:</strong>{" "}
          {typeof modelsCount === "number" ? modelsCount : "—"}
        </div>
      </div>

      {/* графики */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Аномалии по дням</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={anomaliesByDay}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.15)"
              />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.55)" />
              <YAxis stroke="rgba(255,255,255,0.55)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(20,22,26,.85)",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="count" name="Аномалий" fill="#ff7676" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <h3>Прогноз потребления (по времени)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecastSeries}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.15)"
              />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.55)"
                minTickGap={24}
              />
              <YAxis stroke="rgba(255,255,255,0.55)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(20,22,26,.85)",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Прогноз ГВС"
                stroke="#7aa2ff"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* таблицы */}
      <section className={styles.section}>
        <h2>Аномалии</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Время</th>
              <th>MSE</th>
              <th>Уровень</th>
              <th>Подтверждена</th>
              <th>Forecast ID</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a) => (
              <tr key={a.anomaly_id}>
                <td>{a.anomaly_id}</td>
                <td>{new Date(a.datetime).toLocaleString()}</td>
                <td>{a.mse_error}</td>
                <td>{a.severity_level}</td>
                <td>{a.is_confirmed ? "Да" : "Нет"}</td>
                <td>{a.forecast_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2>Прогнозы</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Время</th>
              <th>Прогноз ГВС</th>
              <th>Уверенность</th>
              <th>Model ID</th>
              <th>Version</th>
              <th>Processed ID</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f) => (
              <tr key={f.forecast_id}>
                <td>{f.forecast_id}</td>
                <td>{new Date(f.datetime).toLocaleString()}</td>
                <td>{f.predicted_consumption_gvs}</td>
                <td>{f.confidence_score}</td>
                <td>{f.model_id}</td>
                <td>{f.model_version}</td>
                <td>{f.processed_data_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2>Модели</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Версия</th>
              <th>Trained</th>
              <th>Last Retrained</th>
              <th>Файл</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.model_id}>
                <td>{m.model_id}</td>
                <td>{m.name}</td>
                <td>{m.version}</td>
                <td>{new Date(m.training_date).toLocaleString()}</td>
                <td>{new Date(m.last_retrained).toLocaleString()}</td>
                <td title={m.file_path}>{m.file_path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* блок задач */}
      <section className={styles.section} ref={tasksRef}>
        <h2>Задачи ML</h2>
        <div className={styles.tasks}>
          {tasks.length === 0 ? (
            <div className={styles.card}>Нет активных задач</div>
          ) : null}
          {tasks.map((t, idx) => (
            <div className={styles.taskRow} key={t.task_id}>
              <span className={styles.badge}>{t.type}</span>
              <code>{t.task_id}</code>
              <span className={styles.badge}>{t.status}</span>
              <button className={styles.btn} onClick={() => refreshTask(idx)}>
                Обновить статус
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
