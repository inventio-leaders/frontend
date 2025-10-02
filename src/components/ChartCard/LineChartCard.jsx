import React from "react";
import styles from "./LineChartCard.module.scss";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { x: "AA", y: 20 },
  { x: "BB", y: 130 },
  { x: "CC", y: 70 },
  { x: "DD", y: 110 },
  { x: "EE", y: 160 },
  { x: "FF", y: 95 },
];

export default function LineChartCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>График прогнозов</div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.15)"
            />
            <XAxis dataKey="x" stroke="rgba(255,255,255,0.55)" />
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
              dataKey="y"
              stroke="#7aa2ff"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
