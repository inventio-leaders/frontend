import React, { useMemo } from "react";
import cls from "./TaskCard.module.scss";

// Допустимые статусы от бэка
const STATUSES = ["PENDING", "RUNNING", "SUCCESS", "FAILURE"];

function normalizeStatus(raw) {
  const s = String(raw || "").toUpperCase();
  return STATUSES.includes(s) ? s : "PENDING";
}

// Тона для визуала = 1:1 со статусами
const STATUS_TONE = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCESS: "success",
  FAILURE: "failure",
};

export default function TaskCard({
  title,
  subtitle,
  taskId,
  status,
  result,
  onRefresh,
  onPlay,
  variant = "info", // info | warning | success | danger
}) {
  const norm = normalizeStatus(status);
  const tone = STATUS_TONE[norm];

  const badgeLabel = useMemo(() => {
    switch (norm) {
      case "RUNNING":
        return "В процессе";
      case "SUCCESS":
        return "Готово";
      case "FAILURE":
        return "Ошибка";
      case "PENDING":
      default:
        return "Ожидает";
    }
  }, [norm]);

  const findScrollableAncestor = (el) => {
    let node = el;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const canScrollY = /(auto|scroll)/.test(style.overflowY);
      if (canScrollY && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement || document.body;
  };


  const renderResult = () => {
    if (norm !== "SUCCESS" || !result) return null;
    const isObj = typeof result === "object" && result !== null;
    const link = isObj && (result.url || result.link || result.download_url || result.file_url);
    return (
      <div className={cls.result}>
        <div className={cls.resultTitle}>Результат</div>
        {link ? (
          <a className={cls.resultLink} href={link} target="_blank" rel="noreferrer">
            Скачать / открыть
          </a>
        ) : (
          <pre className={cls.resultPre}>
            {isObj ? JSON.stringify(result, null, 2) : String(result)}
          </pre>
        )}
      </div>
    );
  };

  const handlePlayClick = (e) => {
    const scroller = findScrollableAncestor(e.currentTarget);
    try {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      scroller.scrollTop = 0;
    }
    setTimeout(() => {
      onPlay && onPlay();
    }, 350);
  };

  return (
    <div
      className={`${cls.card} ${cls[variant]}`}
      onMouseMove={(e) => {
        e.currentTarget.style.setProperty("--mx", e.nativeEvent.offsetX + "px");
        e.currentTarget.style.setProperty("--my", e.nativeEvent.offsetY + "px");
      }}
    >
      <div className={cls.glow} />
      <div className={cls.header}>
        <div className={cls.left}>
          <div className={cls.titleRow}>
            <span className={`${cls.dot} ${cls[tone]}`} />
            <h3 className={cls.title}>{title}</h3>
          </div>
          {subtitle && <div className={cls.subtitle}>{subtitle}</div>}
          <div className={cls.meta}>
            <span className={cls.kv}>
              <span className={cls.k}>Task ID:</span>
              <code className={cls.v}>{taskId}</code>
            </span>
            <span className={`${cls.badge} ${cls[`badge_${tone}`]}`}>
              {badgeLabel}
            </span>
          </div>
        </div>

        <div className={cls.right}>
          <button
            type="button"
            className={cls.ghostBtn}
            onClick={onRefresh}
            title="Обновить"
          >
            Обновить
          </button>
          <button
            type="button"
            className={cls.primaryBtn}
            onClick={handlePlayClick}
            title="Играть"
          >
            Играть
          </button>
        </div>
      </div>

      {/* Прогресс — только при RUNNING */}
      <div className={cls.progressWrap} aria-hidden={norm !== "RUNNING"}>
        {norm === "RUNNING" ? (
          <div className={cls.progressBar}>
            <div className={cls.progressStripe} />
          </div>
        ) : (
          <div className={`${cls.progressBar} ${cls[`static_${tone}`]}`} />
        )}
      </div>

      {renderResult()}
    </div>
  );
}
