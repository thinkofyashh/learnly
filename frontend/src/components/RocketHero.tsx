"use client";

import { useEffect, useRef } from "react";

import styles from "./RocketHero.module.css";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function RocketHero({ name }: { name: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const craftRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const beaconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const craft = craftRef.current;
    const bubble = bubbleRef.current;
    const beacon = beaconRef.current;
    if (!stage || !craft || !bubble || !beacon) return;

    const precisePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compactLayout = window.matchMedia("(max-width: 720px)").matches;
    if (!precisePointer || reducedMotion || compactLayout) return;

    let frame = 0;
    let messageTimer = 0;
    let messaged = false;
    let totalTravel = 0;
    let bounds = stage.getBoundingClientRect();
    const position = { x: bounds.width * 0.69, y: bounds.height * 0.42 };
    let target = { ...position };

    craft.style.inset = "0 auto auto 0";

    const placeCraft = () => {
      const width = craft.offsetWidth;
      const height = craft.offsetHeight;
      const x = clamp(position.x, 28, Math.max(28, bounds.width - width - 28));
      const y = clamp(position.y, bounds.height * 0.2, Math.max(48, bounds.height - height - 24));
      const depth = 0.92 + (y / Math.max(1, bounds.height)) * 0.1;
      craft.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${depth})`;
    };

    placeCraft();

    const tick = () => {
      const deltaX = target.x - position.x;
      const deltaY = target.y - position.y;
      const distance = Math.hypot(deltaX, deltaY);

      position.x += deltaX * 0.105;
      position.y += deltaY * 0.105;
      totalTravel += distance * 0.032;

      craft.dataset.moving = distance > 5 ? "true" : "false";
      craft.style.setProperty("--bank", `${clamp(deltaX / 8, -32, 32)}deg`);
      craft.style.setProperty("--pitch", `${clamp(-deltaY / 32, -8, 10)}deg`);
      craft.style.setProperty("--drift-x", `${clamp(deltaX / 40, -5, 5)}px`);
      craft.style.setProperty("--flame", `${clamp(distance / 95, 0.72, 1.28)}`);
      placeCraft();

      if (!messaged && totalTravel > 36) {
        messaged = true;
        bubble.dataset.visible = "true";
        messageTimer = window.setTimeout(() => {
          bubble.dataset.visible = "false";
        }, 2400);
      }

      if (distance > 0.7) {
        frame = window.requestAnimationFrame(tick);
      } else {
        craft.dataset.moving = "false";
        craft.style.setProperty("--bank", "0deg");
        craft.style.setProperty("--pitch", "0deg");
        frame = 0;
      }
    };

    const flyTowardPointer = (event: PointerEvent) => {
      bounds = stage.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return;
      }

      const width = craft.offsetWidth;
      const height = craft.offsetHeight;
      target = {
        x: event.clientX - bounds.left - width * 0.5,
        y: event.clientY - bounds.top - height * 0.22,
      };

      beacon.style.transform = `translate3d(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px, 0)`;
      beacon.dataset.visible = "true";
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const resize = () => {
      bounds = stage.getBoundingClientRect();
      position.x = clamp(position.x, 28, Math.max(28, bounds.width - craft.offsetWidth - 28));
      position.y = clamp(
        position.y,
        bounds.height * 0.2,
        Math.max(48, bounds.height - craft.offsetHeight - 24),
      );
      target = { ...position };
      placeCraft();
    };

    window.addEventListener("pointermove", flyTowardPointer, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      window.removeEventListener("pointermove", flyTowardPointer);
      window.removeEventListener("resize", resize);
      if (frame) window.cancelAnimationFrame(frame);
      if (messageTimer) window.clearTimeout(messageTimer);
    };
  }, []);

  return (
    <div ref={stageRef} className={styles.stage} aria-hidden="true">
      <span ref={beaconRef} className={styles.beacon} />
      <div ref={craftRef} className={styles.craft}>
        <span ref={bubbleRef} className={styles.bubble}>
          Course locked, {name}.
        </span>
        <div className={styles.halo} />
        <svg viewBox="0 0 220 340" role="presentation">
          <defs>
            <linearGradient id="rocket-body" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#597091" />
              <stop offset="0.24" stopColor="#e9f5fa" />
              <stop offset="0.52" stopColor="#ffffff" />
              <stop offset="0.78" stopColor="#9fb8cb" />
              <stop offset="1" stopColor="#34425d" />
            </linearGradient>
            <linearGradient id="rocket-nose" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#d5ff71" />
              <stop offset="0.55" stopColor="#75eedf" />
              <stop offset="1" stopColor="#2396a8" />
            </linearGradient>
            <linearGradient id="rocket-fin" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#9a7cff" />
              <stop offset="0.6" stopColor="#6146c9" />
              <stop offset="1" stopColor="#292455" />
            </linearGradient>
            <radialGradient id="rocket-glass" cx="36%" cy="28%" r="75%">
              <stop offset="0" stopColor="#e9ffff" />
              <stop offset="0.25" stopColor="#81f4eb" />
              <stop offset="0.62" stopColor="#22718b" />
              <stop offset="1" stopColor="#101c3b" />
            </radialGradient>
            <linearGradient id="rocket-flame" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#faffcf" />
              <stop offset="0.35" stopColor="#d1ff6e" />
              <stop offset="0.72" stopColor="#68e8de" />
              <stop offset="1" stopColor="#7460ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <ellipse className={styles.orbit} cx="110" cy="160" rx="94" ry="39" />
          <circle className={styles.orbitDot} cx="24" cy="143" r="5" />
          <circle className={styles.orbitDotSmall} cx="193" cy="179" r="3" />

          <g className={styles.flame}>
            <path d="M82 276c5 22 16 46 28 59 13-14 23-37 28-59Z" fill="url(#rocket-flame)" />
            <path d="M97 277c2 16 7 29 13 38 7-9 12-23 14-38Z" fill="#f8fff0" />
          </g>

          <g className={styles.rocket}>
            <path className={styles.leftFin} d="M79 188c-29 19-43 48-46 82l50-25 12-45Z" />
            <path className={styles.rightFin} d="M141 188c29 19 43 48 46 82l-50-25-12-45Z" />
            <path
              className={styles.body}
              d="M110 10C77 39 68 112 76 202c3 31 14 59 34 82 20-23 31-51 34-82 8-90-1-163-34-192Z"
            />
            <path className={styles.nose} d="M81 66c7-26 17-46 29-56 13 11 23 31 29 56-18-9-39-9-58 0Z" />
            <path className={styles.sideShade} d="M129 63c12 52 8 151-19 221 20-23 31-51 34-82 6-66 3-123-15-139Z" />
            <ellipse className={styles.windowRim} cx="110" cy="126" rx="36" ry="38" />
            <ellipse className={styles.window} cx="110" cy="124" rx="28" ry="30" />
            <ellipse className={styles.windowShine} cx="100" cy="112" rx="9" ry="7" />
            <path className={styles.panel} d="M91 174h38M87 191h46M92 224h36" />
            <path className={styles.seam} d="M110 158v101" />
            <ellipse className={styles.thruster} cx="110" cy="273" rx="28" ry="12" />
            <ellipse className={styles.thrusterCore} cx="110" cy="273" rx="17" ry="6" />
          </g>
        </svg>
      </div>
    </div>
  );
}
