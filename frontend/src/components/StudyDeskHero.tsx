"use client";

import Link from "next/link";
import { PointerEvent, useRef } from "react";

import type { LearnlyDocument } from "@/types/document";

import { PaperBloom } from "./PaperBloom";
import styles from "./StudyDeskHero.module.css";

export function StudyDeskHero({ document }: { document: LearnlyDocument | null }) {
  const heroRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const title = document?.title?.trim() || document?.originalFilename || "Your first PDF";
  const topic = document?.topics[0] || "Ready for a subject";

  function updatePointer(event: PointerEvent<HTMLElement>) {
    if (!heroRef.current) return;

    const bounds = heroRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(() => {
      heroRef.current?.style.setProperty("--pointer-x", x.toFixed(3));
      heroRef.current?.style.setProperty("--pointer-y", y.toFixed(3));
    });
  }

  function resetPointer() {
    heroRef.current?.style.setProperty("--pointer-x", "0");
    heroRef.current?.style.setProperty("--pointer-y", "0");
  }

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      onPointerMove={updatePointer}
      onPointerLeave={resetPointer}
      aria-labelledby="home-title"
    >
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Your personal learning desk</p>
        <h1 id="home-title">
          Everything
          <span>you learn,</span>
          <span>in one place.</span>
        </h1>
        <p className={styles.intro}>
          Add an educational PDF. Learnly reads its pages, keeps the useful details close, and gives
          you a calmer way back into the material.
        </p>
        <div className={styles.actions}>
          <Link href="/notes">Explore library</Link>
          <Link href="/admin/upload">Add a PDF ↗</Link>
        </div>
      </div>

      <div className={styles.composition} aria-hidden>
        <div className={styles.bloomWrap}>
          <PaperBloom />
        </div>
        <div className={styles.pdfSlip}>
          <span>PDF / SAVED</span>
          <strong>{title}</strong>
          <small>{document?.pageCount ? `${document.pageCount} pages` : "Pages appear here"}</small>
        </div>
        <div className={styles.topicSlip}>
          <span>TOPIC</span>
          <strong>{topic}</strong>
        </div>
        <div className={styles.readingSlip}>
          <span>READING TIME</span>
          <strong>
            {document?.estimatedReadingMinutes
              ? `${document.estimatedReadingMinutes} minutes`
              : "Calculated after reading"}
          </strong>
        </div>
        <div className={styles.processNote}>
          <i />
          <span>stored</span>
          <i />
          <span>read</span>
          <i />
          <span>organized</span>
        </div>
      </div>

      <p className={styles.footnote}>PDFs in. Organized study material out.</p>
    </section>
  );
}
