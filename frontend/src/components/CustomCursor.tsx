"use client";

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

export function CustomCursor() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Preserve the native cursor and skip decoration for touch or reduced-motion users.
    if (!finePointer.matches || reducedMotion.matches) return;

    const glow = glowRef.current;
    if (!glow) return;
    const glowElement: HTMLDivElement = glow;

    let animationFrame = 0;
    let pointerX = -100;
    let pointerY = -100;

    function renderCursor() {
      glowElement.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      animationFrame = 0;
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      glowElement.dataset.visible = "true";

      // Coalesce rapid pointer events into one paint per animation frame.
      if (!animationFrame) animationFrame = requestAnimationFrame(renderCursor);
    }

    function hideCursor() {
      glowElement.dataset.visible = "false";
    }

    function pressCursor() {
      glowElement.dataset.pressed = "true";
    }

    function releaseCursor() {
      glowElement.dataset.pressed = "false";
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", pressCursor);
    window.addEventListener("pointerup", releaseCursor);
    window.addEventListener("pointercancel", releaseCursor);
    document.documentElement.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", pressCursor);
      window.removeEventListener("pointerup", releaseCursor);
      window.removeEventListener("pointercancel", releaseCursor);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={glowRef} className={styles.glow} />
    </div>
  );
}
