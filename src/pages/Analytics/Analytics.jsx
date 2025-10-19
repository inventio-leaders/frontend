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
import { useLazyExportProcessedToXlsxQuery } from "../../api/processedDataApi";
import {
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

const pad2 = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
const toNaiveLocalISO = (s) =>
  s && s.length === 16 ? `${s}:00` : s || undefined;
const dayKey = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function Analytics() {
  const defaultFrom = new Date("2025-04-03T00:00:00");
  const defaultTo = new Date("2025-05-03T00:00:00");
  const [dtFrom, setDtFrom] = useState(toLocalInput(defaultFrom));
  const [dtTo, setDtTo] = useState(toLocalInput(defaultTo));

  const [thresholdPct, setThresholdPct] = useState(10);
  const [saveToDb, setSaveToDb] = useState(true);

  const rangeParams = useMemo(
    () => ({
      dt_from: toNaiveLocalISO(dtFrom),
      dt_to: toNaiveLocalISO(dtTo),
      order_desc: false,
      limit: 500,
    }),
    [dtFrom, dtTo]
  );

  const { data: anomalies = [] } = useListAnomaliesQuery(rangeParams);
  const { data: forecasts = [] } = useListForecastsQuery(rangeParams);

  const { data: anomaliesCount } = useCountAnomaliesQuery(rangeParams);
  const { data: forecastsCount } = useCountForecastsQuery(rangeParams);


  const [triggerExport, { isFetching: exporting }] =
    useLazyExportProcessedToXlsxQuery();

  const onExportAnomalies = async () => {
    try {
      const res = await triggerExport({
        dt_from: rangeParams.dt_from,
        dt_to: rangeParams.dt_to,
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

  const [runForecast, { isLoading: forecasting }] = useRunForecastMutation();
  const [anomalyScan, { isLoading: scanning }] = useAnomalyScanMutation();
  const [fetchTaskStatus] = useLazyTaskStatusQuery();
  const [tasks, setTasks] = useState([]);

  const pushTask = (task, type) =>
    setTasks((prev) => [{ ...task, type }, ...prev]);
  const lastTaskByType = (type) => tasks.find((t) => t.type === type);

  const refreshTask = async (taskId) => {
    try {
      const updated = await fetchTaskStatus(taskId).unwrap();
      setTasks((arr) =>
        arr.map((x) => (x.task_id === taskId ? { ...x, ...updated } : x))
      );
    } catch {}
  };

  useEffect(() => {
    if (!tasks.length) return;
    const interval = setInterval(
      () => tasks.forEach((t) => refreshTask(t.task_id)),
      5000
    );
    return () => clearInterval(interval);
  }, [tasks]);

  const anomaliesByDay = useMemo(() => {
    const map = new Map();
    anomalies.forEach((a) => {
      const d = new Date(a.datetime);
      const k = dayKey(d);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
  }, [anomalies]);

  const forecastSeries = useMemo(
    () =>
      forecasts.map((f) => {
        const d = new Date(f.datetime);
        return {
          day: dayKey(d),
          timeLabel: d.toLocaleString(),
          predicted: parseFloat(f.predicted_consumption_gvs),
          conf:
            f.confidence_score != null ? parseFloat(f.confidence_score) : null,
        };
      }),
    [forecasts]
  );

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
  const handleRunForecast = async () => {
    try {
      const task = await runForecast({ horizon_hours: 48 }).unwrap();
      pushTask(task, "forecast");
    } catch {
      alert("Ошибка прогноза");
    }
  };

  const [selectedAnomalyDay, setSelectedAnomalyDay] = useState(null);
  const [selectedForecastDay, setSelectedForecastDay] = useState(null);
  const anomalyRowRefs = useRef({});
  const forecastRowRefs = useRef({});

  const scrollToRow = (refMap, key) => {
    const el = refMap.current?.[key];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const onAnomalyBarClick = (_, index) => {
    const item = anomaliesByDay[index];
    if (!item?.day) return;
    setSelectedAnomalyDay(item.day);
    scrollToRow(anomalyRowRefs, item.day);
  };

  const handleForecastDotClick = (dotProps) => {
    const key = dotProps?.payload?.day;
    if (!key) return;
    setSelectedForecastDay(key);
    scrollToRow(forecastRowRefs, key);
  };

  return (
    <div className={styles.page}>
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

        <div className={styles.statCards}>
          <div className={styles.card}>
            <strong>Аномалий:</strong>{" "}
            {typeof anomaliesCount === "number" ? anomaliesCount : "—"}
          </div>
          <div className={styles.card}>
            <strong>Прогнозов:</strong>{" "}
            {typeof forecastsCount === "number" ? forecastsCount : "—"}
          </div>
        </div>
      </div>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionHeader__head}>
            <h2>Аномалии</h2>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
              />
              Сохранять в БД
            </label>
          </div>
          <div className={styles.actions}>
            <div className={styles.inlineField}>
              <div>Порог, %</div>
              <input
                className={styles.number}
                type="number"
                min={0}
                max={100}
                value={thresholdPct}
                onChange={(e) => setThresholdPct(e.target.value)}
              />
            </div>
            <button
              className={styles.btn}
              onClick={onExportAnomalies}
              disabled={exporting}
              title="Вычислить/экспортировать выявленные аномалии"
            >
              {exporting ? "Экспорт…" : "Экспорт/расчёт аномалий (XLSX)"}
            </button>
            <button
              className={styles.btn}
              onClick={handleScanAnomaly}
              disabled={scanning}
              title="ML-сканирование аномалий в периоде"
            >
              {scanning ? "Сканирую…" : "Сканировать аномалии (ML)"}
            </button>
          </div>
        </header>
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
              <Bar
                dataKey="count"
                name="Аномалий"
                fill="#ff7676"
                onClick={onAnomalyBarClick}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.tableCard}>
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
              {anomalies.map((a) => {
                const d = new Date(a.datetime);
                const key = dayKey(d);
                return (
                  <tr
                    key={a.anomaly_id}
                    ref={(el) => {
                      if (el && !anomalyRowRefs.current[key]) {
                        anomalyRowRefs.current[key] = el;
                      }
                    }}
                    className={
                      key === selectedAnomalyDay
                        ? styles.selectedRow
                        : undefined
                    }
                  >
                    <td>{a.anomaly_id}</td>
                    <td>{d.toLocaleString()}</td>
                    <td>{a.mse_error}</td>
                    <td>{a.severity_level}</td>
                    <td>{a.is_confirmed ? "Да" : "Нет"}</td>
                    <td>{a.forecast_id ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lastTaskByType("anomaly_scan") && (
          <>
            <div className={styles.taskInlineHead}>Задача данной секции</div>
            <div className={styles.taskInline}>
              <span className={styles.badge}>anomaly_scan</span>
              <code>{lastTaskByType("anomaly_scan").task_id}</code>
              <span className={styles.badge}>
                {lastTaskByType("anomaly_scan").status}
              </span>
              <button
                className={styles.btn}
                onClick={() =>
                  refreshTask(lastTaskByType("anomaly_scan").task_id)
                }
              >
                Обновить статус
              </button>
            </div>
          </>
        )}
      </section>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionHeader__head}>
            <h2>Прогнозы</h2>
            <button
              className={styles.btn}
              onClick={handleRunForecast}
              disabled={forecasting}
              title="Запустить расчёт прогноза"
            >
              {forecasting ? "Запуск…" : "Запустить прогноз (ML)"}
            </button>
          </div>
        </header>

        <div className={styles.card}>
          <h3>Прогноз потребления (по времени)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecastSeries}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.15)"
              />
              <XAxis
                dataKey="timeLabel"
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
                dot={{ r: 4, onClick: handleForecastDotClick }}
                activeDot={{ r: 6, onClick: handleForecastDotClick }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.tableCard}>
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
              {forecasts.map((f) => {
                const d = new Date(f.datetime);
                const key = dayKey(d);
                return (
                  <tr
                    key={f.forecast_id}
                    ref={(el) => {
                      if (el && !forecastRowRefs.current[key]) {
                        forecastRowRefs.current[key] = el;
                      }
                    }}
                    className={
                      key === selectedForecastDay
                        ? styles.selectedRow
                        : undefined
                    }
                  >
                    <td>{f.forecast_id}</td>
                    <td>{d.toLocaleString()}</td>
                    <td>{f.predicted_consumption_gvs}</td>
                    <td>{f.confidence_score}</td>
                    <td>{f.model_id}</td>
                    <td>{f.model_version}</td>
                    <td>{f.processed_data_id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lastTaskByType("forecast") && (
          <>
            <div className={styles.taskInlineHead}>Задача данной секции</div>
            <div className={styles.taskInline}>
              <span className={styles.badge}>forecast</span>
              <code>{lastTaskByType("forecast").task_id}</code>
              <span className={styles.badge}>
                {lastTaskByType("forecast").status}
              </span>
              <button
                className={styles.btn}
                onClick={() => refreshTask(lastTaskByType("forecast").task_id)}
              >
                Обновить статус
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
