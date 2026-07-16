"use client";

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

const interactiveSelector = "a, button, input, select, textarea, label, [role='button']";

export function CustomCursor() {
  const pointRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    const point = pointRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!point || !ring || !glow) return;

    let animationFrame = 0;
    let pointerX = -100;
    let pointerY = -100;

    document.documentElement.classList.add("custom-cursor-active");

    function renderCursor() {
      const position = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      point!.style.transform = position;
      ring!.style.transform = position;
      glow!.style.transform = position;
      animationFrame = 0;
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      point!.dataset.visible = "true";
      ring!.dataset.visible = "true";
      glow!.dataset.visible = "true";

      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(interactiveSelector) ? "true" : "false";
      ring!.dataset.interactive = interactive;
      glow!.dataset.interactive = interactive;

      if (!animationFrame) animationFrame = requestAnimationFrame(renderCursor);
    }

    function hideCursor() {
      point!.dataset.visible = "false";
      ring!.dataset.visible = "false";
      glow!.dataset.visible = "false";
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
      document.documentElement.classList.remove("custom-cursor-active");
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={glowRef} className={styles.glow} />
      <div ref={ringRef} className={styles.ring} />
      <div ref={pointRef} className={styles.point} />
    </div>
  );
}
