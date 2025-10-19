import React, { useEffect, useRef, useState } from "react";
import s from "./DropletCatchGame.module.scss";

export default function DropletCatchGame({
  width = 640,
  height = 360,
  onClose,
}) {
  const canvasRef = useRef(null);

  const DROP_COLOR = "rgba(122,162,255,0.95)";
  const FILL_TOP = "rgba(122,162,255,0.90)";
  const FILL_BOTTOM = "rgba(122,162,255,0.60)";

  const [running, setRunning] = useState(true);
  const [uiScore, setUiScore] = useState(0);
  const [uiBottles, setUiBottles] = useState(0);
  const [uiFill, setUiFill] = useState(0);

  const scoreRef = useRef(0);
  const bottlesRef = useRef(0);
  const fillRef = useRef(0);

  const gameRef = useRef({
    x: width / 2,
    speed: 6,
    droplets: [],
    lastSpawn: 0,
    keys: { left: false, right: false },
    t0: 0,
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") gameRef.current.keys.left = true;
      if (e.key === "ArrowRight") gameRef.current.keys.right = true;
      if (e.key.toLowerCase() === "p") setRunning((r) => !r);
      if (e.key === "Escape" && onClose) onClose();
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowLeft") gameRef.current.keys.left = false;
      if (e.key === "ArrowRight") gameRef.current.keys.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onClose]);

  const spawnDroplet = () => {
    const x = 20 + Math.random() * (width - 40);
    const v = 2 + Math.random() * 2.5;
    gameRef.current.droplets.push({ x, y: -10, v, r: 4 + Math.random() * 3 });
  };

  const makeBottlePath = (ctx, bx, by, bodyW, bodyH) => {
    const neckW = Math.max(20, bodyW * 0.28);
    const neckH = 18;
    const shoulderH = 12;
    const radius = 6;

    const leftX = bx - bodyW / 2;
    const rightX = bx + bodyW / 2;
    const topY = by - neckH - shoulderH - bodyH;
    const shoulderY = topY + shoulderH;
    const neckTopY = topY;
    const neckBottomY = topY + neckH;

    const path = new Path2D();

    path.moveTo(bx - neckW / 2, neckTopY);
    path.lineTo(bx + neckW / 2, neckTopY);
    path.lineTo(bx + neckW / 2, neckBottomY);

    path.quadraticCurveTo(
      bx + neckW / 2 + 10,
      neckBottomY + 2,
      rightX,
      shoulderY
    );

    path.lineTo(rightX, by - radius);
    path.quadraticCurveTo(rightX, by, rightX - radius, by);
    path.lineTo(leftX + radius, by);
    path.quadraticCurveTo(leftX, by, leftX, by - radius);

    path.lineTo(leftX, shoulderY);
    path.quadraticCurveTo(
      bx - neckW / 2 - 10,
      neckBottomY + 2,
      bx - neckW / 2,
      neckBottomY
    );
    path.lineTo(bx - neckW / 2, neckTopY);

    path.closePath();
    return path;
  };

  const step = (t) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (!gameRef.current.t0) gameRef.current.t0 = t;
    const dt = (t - gameRef.current.t0) / 16.7;
    gameRef.current.t0 = t;

    const speed = gameRef.current.speed;
    if (gameRef.current.keys.left) gameRef.current.x -= speed;
    if (gameRef.current.keys.right) gameRef.current.x += speed;
    gameRef.current.x = Math.max(30, Math.min(width - 30, gameRef.current.x));

    gameRef.current.lastSpawn += dt;
    if (gameRef.current.lastSpawn > 10) {
      spawnDroplet();
      gameRef.current.lastSpawn = 0;
    }

    const bottleBodyH = 80;
    const bottleBodyW = 70;
    const bx = gameRef.current.x;
    const by = height - 24;

    ctx.clearRect(0, 0, width, height);
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "rgba(122,162,255,0.15)");
    g.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = DROP_COLOR;
    for (let d of gameRef.current.droplets) {
      d.y += d.v;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const bodyLeft = bx - bottleBodyW / 2;
    const bodyRight = bx + bottleBodyW / 2;
    const bodyTop = by - bottleBodyH;
    const bodyBottom = by;

    gameRef.current.droplets = gameRef.current.droplets.filter((d) => {
      const caught =
        d.x >= bodyLeft &&
        d.x <= bodyRight &&
        d.y + d.r >= bodyTop &&
        d.y - d.r <= bodyBottom;
      if (caught) {
        scoreRef.current += 1;
        fillRef.current = Math.min(100, fillRef.current + 5);
        if (fillRef.current >= 100) {
          bottlesRef.current += 1;
          fillRef.current = 0;
        }
        // синхронно обновляем UI
        setUiScore(scoreRef.current);
        setUiFill(fillRef.current);
        setUiBottles(bottlesRef.current);
        return false;
      }
      return d.y - d.r <= height;
    });

    const bottlePath = makeBottlePath(ctx, bx, by, bottleBodyW, bottleBodyH);

    ctx.save();
    ctx.clip(bottlePath);
    const fillHeight = (bottleBodyH * fillRef.current) / 100;
    const fillTop = by - fillHeight;
    const gradFill = ctx.createLinearGradient(0, fillTop, 0, by);
    gradFill.addColorStop(0, FILL_TOP);
    gradFill.addColorStop(1, FILL_BOTTOM);
    ctx.fillStyle = gradFill;
    ctx.fillRect(
      bx - bottleBodyW / 2 + 1,
      fillTop,
      bottleBodyW - 2,
      fillHeight
    );
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke(bottlePath);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, width, 28);
    ctx.fillStyle = "#fff";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`Очки: ${scoreRef.current}`, 10, 18);
    ctx.fillText(`Бутылок: ${bottlesRef.current}`, 110, 18);
    ctx.fillText(`Fill: ${fillRef.current}%`, 220, 18);
    ctx.fillText(`P — пауза, Esc — выход`, width - 190, 18);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      gameRef.current.x = Math.max(30, Math.min(canvas.width - 30, x));
    };
    canvas.addEventListener("mousemove", onMouseMove);

    let raf;
    const loop = (t) => {
      if (running) step(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [running, width, height]);

  return (
    <div className={s.wrap}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={s.canvas}
      />
      <div className={s.controls}>
        <div className={s.stats}>
          <span>Очки: {uiScore}</span>
          <span>Бутылок: {uiBottles}</span>
          <span>Fill: {uiFill}%</span>
        </div>
        <div className={s.buttons}>
          <button
            type="button"
            className={s.btn}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Пауза" : "Продолжить"}
          </button>
          <button type="button" className={s.btn} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
