"use client";

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

const interactiveSelector = "a, button, input, select, textarea, label, [role='button']";

export function CustomCursor() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    let animationFrame = 0;
    let pointerX = -100;
    let pointerY = -100;

    function renderCursor() {
      const position = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      glow!.style.transform = position;
      animationFrame = 0;
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      glow!.dataset.visible = "true";

      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(interactiveSelector) ? "true" : "false";
      glow!.dataset.interactive = interactive;

      if (!animationFrame) animationFrame = requestAnimationFrame(renderCursor);
    }

    function hideCursor() {
      glow!.dataset.visible = "false";
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
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
