import React, { useEffect, useMemo, useState } from "react";
import styles from "./Training.module.scss";
import { useListModelsQuery } from "../../api/modelsApi";
import { useTrainMutation, useLazyTaskStatusQuery } from "../../api/mlApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import TaskCard from "../../components/TaskCard/TaskCard";
import DropletCatchGame from "../../components/DropletCatchGame/DropletCatchGame";

const fmtDT = (v) => (v ? new Date(v).toLocaleString() : "—");
const LS_KEY = "training_params_v1";

const TRAIN_TASK_LS_KEY = "training_task_v1";
const loadTrainTask = () => {
  try {
    const raw = localStorage.getItem(TRAIN_TASK_LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveTrainTask = (task) => {
  if (!task) {
    localStorage.removeItem(TRAIN_TASK_LS_KEY);
    return;
  }
  const st = String(task.status || "").toUpperCase();
  if (st === "SUCCESS") {
    localStorage.removeItem(TRAIN_TASK_LS_KEY);
  } else {
    localStorage.setItem(TRAIN_TASK_LS_KEY, JSON.stringify(task));
  }
};

function useLockScroll(locked) {
  useEffect(() => {
    if (!locked) return;

    const scrollEl = document.scrollingElement || document.documentElement;
    const scrollY = scrollEl.scrollTop;

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;

    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;

    const prevent = (e) => e.preventDefault();
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);

      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.paddingRight = "";
      scrollEl.scrollTo(0, scrollY);
    };
  }, [locked]);
}

const DEFAULT_PARAMS = {
  narx: true,
  ae: true,
  window: 24,
  ae_threshold_percentile: 99,
  epochs: 10,
  lr: 0.001,
  batch_size: 64,
  seed: 42,
};

const PRESETS = {
  "Быстрый черновик": {
    ...DEFAULT_PARAMS,
    epochs: 3,
    batch_size: 32,
    lr: 0.0015,
  },
  "Стабильный базовый": { ...DEFAULT_PARAMS },
  Тщательный: { ...DEFAULT_PARAMS, epochs: 25, batch_size: 128, lr: 0.0007 },
};

export default function Training() {
  const { data: models = [], isFetching, refetch } = useListModelsQuery();

  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved
        ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) }
        : DEFAULT_PARAMS;
    } catch {
      return DEFAULT_PARAMS;
    }
  });

  const [train, { isLoading: training }] = useTrainMutation();

  const [fetchTaskStatus] = useLazyTaskStatusQuery();
  const [trainTask, setTrainTask] = useState(() => loadTrainTask());

  const [metricsModel, setMetricsModel] = useState(null);

  const [gameOpen, setGameOpen] = useState(false);
  const [gameTaskLabel, setGameTaskLabel] = useState("");
  const openGame = (label) => {
    setGameTaskLabel(label || "Обучение модели");
    setGameOpen(true);
  };
  const closeGame = () => {
    setGameOpen(false);
    setGameTaskLabel("");
  };

  useLockScroll(!!metricsModel || gameOpen);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (metricsModel) setMetricsModel(null);
        if (gameOpen) setGameOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [metricsModel, gameOpen]);

  const renderMetrics = (metrics) => {
    if (!metrics || typeof metrics !== "object") {
      return <div className={styles.empty}>Метрик нет</div>;
    }
    const entries = Object.entries(metrics);
    if (!entries.length) return <div className={styles.empty}>Метрик нет</div>;
    const allScalars = entries.every(([, v]) =>
      ["string", "number", "boolean", "bigint"].includes(typeof v)
    );
    return allScalars ? (
      <ul className={styles.kvList}>
        {entries.map(([k, v]) => (
          <li key={k}>
            <span className={styles.kvKey}>{k}</span>
            <span className={styles.kvVal}>
              {typeof v === "number" ? Number(v).toPrecision(6) : String(v)}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <pre className={styles.jsonBlock}>{JSON.stringify(metrics, null, 2)}</pre>
    );
  };

  const setField = (name, value) => setParams((p) => ({ ...p, [name]: value }));
  const onNum = (name) => (e) =>
    setField(name, e.target.value === "" ? "" : Number(e.target.value));
  const onFloat = (name) => (e) =>
    setField(name, e.target.value === "" ? "" : parseFloat(e.target.value));
  const onBool = (name) => (e) => setField(name, e.target.checked);

  const applyPreset = (k) => setParams(PRESETS[k]);
  const resetDefaults = () => setParams(DEFAULT_PARAMS);

  useEffect(() => {
    const safe = {
      ...params,
      window: clampInt(params.window, 1, 10000, DEFAULT_PARAMS.window),
      ae_threshold_percentile: clampInt(
        params.ae_threshold_percentile,
        50,
        100,
        DEFAULT_PARAMS.ae_threshold_percentile
      ),
      epochs: clampInt(params.epochs, 1, 10000, DEFAULT_PARAMS.epochs),
      lr: clampFloat(params.lr, 1e-6, 1, DEFAULT_PARAMS.lr),
      batch_size: clampInt(
        params.batch_size,
        1,
        100000,
        DEFAULT_PARAMS.batch_size
      ),
      seed: clampInt(params.seed, 0, 2 ** 31 - 1, DEFAULT_PARAMS.seed),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(safe));
  }, [params]);

  const handleTrain = async () => {
    try {
      const body = {
        narx: !!params.narx,
        ae: !!params.ae,
        window: Number(params.window),
        ae_threshold_percentile: Number(params.ae_threshold_percentile),
        epochs: Number(params.epochs),
        lr: Number(params.lr),
        batch_size: Number(params.batch_size),
        seed: Number.isFinite(params.seed) ? Number(params.seed) : undefined,
      };
      const task = await train(body).unwrap();
      setTrainTask({ ...task, type: "train", created_at: Date.now() });
    } catch (e) {
      console.error(e);
      alert("Ошибка запуска обучения");
    }
  };

  const refreshTrainTask = async () => {
    if (!trainTask?.task_id) return;
    try {
      const upd = await fetchTaskStatus(trainTask.task_id).unwrap();
      setTrainTask((t) => (t ? { ...t, ...upd } : upd));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    saveTrainTask(trainTask);
  }, [trainTask]);

  useEffect(() => {
    if (!trainTask?.task_id) return;
    const id = setInterval(refreshTrainTask, 5000);
    return () => clearInterval(id);
  }, [trainTask?.task_id]);

  const rows = useMemo(() => models, [models]);

  const metricKeys = useMemo(() => {
    const set = new Set();
    models.forEach((m) => {
      if (m?.metrics && typeof m.metrics === "object") {
        Object.entries(m.metrics).forEach(([k, v]) => {
          if (typeof v === "number" && Number.isFinite(v)) set.add(k);
        });
      }
    });
    return Array.from(set);
  }, [models]);

  const metricsMatrix = useMemo(() => {
    const sorted = [...models].sort((a, b) => {
      const da = a?.training_date ? new Date(a.training_date).getTime() : 0;
      const db = b?.training_date ? new Date(b.training_date).getTime() : 0;
      return da - db;
    });
    return sorted.map((m) => {
      const row = {
        model_id: m.model_id,
        modelLabel: `${m.name || "Model"} · ${m.version || "-"}`,
      };
      metricKeys.forEach((k) => {
        const v = m?.metrics?.[k];
        row[k] = typeof v === "number" && Number.isFinite(v) ? v : null;
      });
      return row;
    });
  }, [models, metricKeys]);

  const COLORS = [
    "#7aa2ff",
    "#ff7676",
    "#61d095",
    "#f6c560",
    "#c993ff",
    "#66d9e8",
    "#f38ba8",
    "#94d82d",
    "#ffd43b",
    "#b197fc",
  ];

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Модели</h2>
          <div className={styles.actions}>
            <button
              className={styles.btn}
              onClick={handleTrain}
              disabled={training}
              title="Запустить обучение модели"
            >
              {training ? "Обучаю…" : "Обучить модель (ML)"}
            </button>
            <button
              className={styles.btn}
              onClick={refetch}
              disabled={isFetching}
              title="Обновить список моделей"
            >
              {isFetching ? "Обновляю…" : "Обновить"}
            </button>
          </div>
        </header>

        <div className={styles.card}>
          <div className={styles.formGrid}>
            <div className={styles.switches}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={!!params.narx}
                  onChange={onBool("narx")}
                />
                <span>NARX-LSTM</span>
              </label>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={!!params.ae}
                  onChange={onBool("ae")}
                />
                <span>LSTM-Autoencoder</span>
              </label>
            </div>

            <div className={styles.rowCols}>
              <div className={styles.field}>
                <label>Окно (часов)</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={params.window}
                  onChange={onNum("window")}
                />
              </div>
              <div className={styles.field}>
                <label>AE порог, перцентиль</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={params.ae_threshold_percentile}
                  onChange={onNum("ae_threshold_percentile")}
                />
              </div>
              <div className={styles.field}>
                <label>Epochs</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={params.epochs}
                  onChange={onNum("epochs")}
                />
              </div>
              <div className={styles.field}>
                <label>LR</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.000001"
                  max="1"
                  value={params.lr}
                  onChange={onFloat("lr")}
                />
              </div>
              <div className={styles.field}>
                <label>Batch size</label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={params.batch_size}
                  onChange={onNum("batch_size")}
                />
              </div>
              <div className={styles.field}>
                <label>Seed</label>
                <input
                  type="number"
                  min={0}
                  max={2147483647}
                  value={params.seed}
                  onChange={onNum("seed")}
                />
              </div>
            </div>

            <div className={styles.presetRow}>
              <span className={styles.hint}>Пресеты:</span>
              {Object.keys(PRESETS).map((k) => (
                <button
                  key={k}
                  className={styles.ghost}
                  onClick={() => applyPreset(k)}
                >
                  {k}
                </button>
              ))}
              <button className={styles.ghost} onClick={resetDefaults}>
                Сбросить
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
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
              {rows.map((m) => (
                <tr
                  key={m.model_id}
                  className={styles.clickableRow}
                  onClick={() => setMetricsModel(m)}
                  title="Показать метрики"
                >
                  <td>{m.model_id}</td>
                  <td>{m.name}</td>
                  <td>{m.version}</td>
                  <td>{fmtDT(m.training_date)}</td>
                  <td>{fmtDT(m.last_retrained)}</td>
                  <td title={m.file_path || ""}>{m.file_path || "—"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    {isFetching ? "Загрузка…" : "Нет моделей"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 className={styles.chartTitle}>Метрики по моделям</h3>
          {metricKeys.length && metricsMatrix.length ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(260, metricsMatrix.length * 44)}
            >
              <BarChart
                data={metricsMatrix}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.15)"
                />
                <XAxis type="number" stroke="rgba(255,255,255,0.55)" />
                <YAxis
                  type="category"
                  dataKey="modelLabel"
                  width={220}
                  stroke="rgba(255,255,255,0.55)"
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,22,26,.85)",
                    border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: 12,
                  }}
                  formatter={(v, k) =>
                    typeof v === "number"
                      ? [Number(v).toPrecision(6), k]
                      : [v, k]
                  }
                />
                <Legend />
                {metricKeys.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    name={k}
                    fill={COLORS[i % COLORS.length]}
                    barSize={14}
                    radius={[4, 4, 4, 4]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>
              {models.length
                ? "Числовые метрики у моделей не найдены"
                : "Нет данных по моделям"}
            </div>
          )}
        </div>

        {trainTask && (
          <TaskCard
            variant="warning"
            title="Обучение модели"
            subtitle="Запущена задача обучения"
            taskId={trainTask.task_id}
            status={trainTask.status}
            result={trainTask.result}
            onRefresh={refreshTrainTask}
            onPlay={() => openGame("Обучение модели")}
          />
        )}
        {metricsModel && (
          <div
            className={styles.modalOverlay}
            onClick={() => setMetricsModel(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Метрики модели</h3>
                  <div className={styles.modalSub}>
                    <b>ID:</b> {metricsModel.model_id} • <b>Имя:</b>{" "}
                    {metricsModel.name} • <b>Версия:</b> {metricsModel.version}
                  </div>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setMetricsModel(null)}
                  aria-label="Закрыть"
                  title="Закрыть"
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                {renderMetrics(metricsModel.metrics)}
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.btn}
                  onClick={() => setMetricsModel(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {gameOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={closeGame}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Игра: «Лови капли»</h3>
                  <div className={styles.modalSub}>Задача: {gameTaskLabel}</div>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={closeGame}
                  aria-label="Закрыть"
                  title="Закрыть"
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <DropletCatchGame onClose={closeGame} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function clampInt(val, min, max, fallback) {
  const n = Number(val);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function clampFloat(val, min, max, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
