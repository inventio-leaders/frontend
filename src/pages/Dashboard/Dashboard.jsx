import React from "react";
import styles from "./Dashboard.module.scss";
import LineChartCard from "../../components/ChartCard/LineChartCard";

export default function Dashboard() {
  return (
    <div className={styles.grid}>
      <LineChartCard />
      {/* остальное из макета добавим позже карточками */}
    </div>
  );
}
