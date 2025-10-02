import React from "react";
import styles from "./DataTable.module.scss";

export default function DataTable({ rows }) {
  if (!rows?.length) return null;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Дата/время</th>
            <th>Час</th>
            <th>День недели</th>
            <th>Выходной</th>
            <th>ГВС</th>
            <th>ХВС</th>
            <th>Δ ГВС-ХВС</th>
            <th>Тподачи</th>
            <th>Тобратки</th>
            <th>ΔT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.record_id}>
              <td>{new Date(r.datetime).toLocaleString()}</td>
              <td>{r.hour}</td>
              <td>{r.day_of_week}</td>
              <td>{r.is_weekend ? "Да" : "Нет"}</td>
              <td>{r.consumption_gvs}</td>
              <td>{r.consumption_hvs}</td>
              <td>{r.delta_gvs_hvs}</td>
              <td>{r.temp_gvs_supply}</td>
              <td>{r.temp_gvs_return}</td>
              <td>{r.temp_delta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
