import React, { useMemo, useState } from "react";
import styles from "./Dashboard.module.scss";
import {
  useListProcessedQuery,
  useImportProcessedExcelMutation,
  useCountProcessedQuery,
} from "../../api/processedDataApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DataTable from "../../components/DataTable/DataTable";

const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

export default function Dashboard() {
  const defaultFrom = new Date("2025-04-03T00:00:00");
  const defaultTo = new Date("2025-05-03T00:00:00");

  const [dtFrom, setDtFrom] = useState(toLocalInput(defaultFrom));
  const [dtTo, setDtTo] = useState(toLocalInput(defaultTo));

  const toNaiveLocalISO = (s) => {
    if (!s) return undefined;
    return s.length === 16 ? `${s}:00` : s;
  };

  const queryParams = useMemo(
    () => ({
      dt_from: toNaiveLocalISO(dtFrom),
      dt_to: toNaiveLocalISO(dtTo),
      limit: 500,
      order_desc: false,
    }),
    [dtFrom, dtTo]
  );

  const {
    data: items = [],
    isFetching,
    refetch,
    error,
  } = useListProcessedQuery(queryParams);
  const { data: totalCount } = useCountProcessedQuery(queryParams);
  const [importExcel, { isLoading: importing }] =
    useImportProcessedExcelMutation();

  const chartData = useMemo(() => {
    return items.map((r) => ({
      time: new Date(r.datetime).toLocaleString(),
      gvs: parseFloat(r.consumption_gvs),
      hvs:
        r.consumption_hvs != null ? parseFloat(r.consumption_hvs) : undefined,
      delta: r.delta_gvs_hvs != null ? parseFloat(r.delta_gvs_hvs) : undefined,
    }));
  }, [items]);

  const onImport = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      await importExcel({ files: Array.from(files), dedupe: true }).unwrap();
      await refetch();
      e.target.value = "";
    } catch (err) {
      console.error(err);
      alert("Импорт не удался");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <label>
            С&nbsp;даты:
            <input
              type="datetime-local"
              value={dtFrom}
              onChange={(e) => setDtFrom(e.target.value)}
            />
          </label>
          <label>
            По&nbsp;дату:
            <input
              type="datetime-local"
              value={dtTo}
              onChange={(e) => setDtTo(e.target.value)}
            />
          </label>
          <button
            className={styles.btn}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Загружаю..." : "Применить"}
          </button>
        </div>

        <div className={styles.importBox}>
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple
              onChange={onImport}
              disabled={importing}
            />
            {importing ? "Импортирую..." : "Импорт Excel"}
          </label>
          {typeof totalCount === "number" && (
            <span className={styles.count}>Записей: {totalCount}</span>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.alert}>
          Ошибка загрузки данных. Проверьте токен/права.
        </div>
      )}

      {items.length === 0 && !isFetching ? (
        <div className={styles.empty}>
          <h2>Нет данных за выбранный период</h2>
          <p>
            Загрузите один или несколько .xlsx файлов с обработанными данными.
          </p>
          <label className={styles.primaryUpload}>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple
              onChange={onImport}
              disabled={importing}
            />
            {importing ? "Импортирую..." : "Импортировать"}
          </label>
        </div>
      ) : (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                Потребление ГВС (по времени)
              </div>
            </div>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={chartData}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
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
                    dataKey="gvs"
                    name="ГВС"
                    stroke="#7aa2ff"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DataTable rows={items} />
        </>
      )}
    </div>
  );
}
