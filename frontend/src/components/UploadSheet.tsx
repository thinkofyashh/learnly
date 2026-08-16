"use client";

import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useRef } from "react";

import { UploadExperience } from "@/components/UploadExperience";

import styles from "./UploadSheet.module.css";

export function UploadSheet({
  onClose,
  returnFocusRef,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-sheet-title"
        onKeyDown={handleKeyDown}
      >
        <header>
          <div>
            <span>Add to your desk</span>
            <h1 id="upload-sheet-title">Add something worth remembering.</h1>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close upload">
            Close <kbd>Esc</kbd>
          </button>
        </header>
        <UploadExperience />
      </div>
    </div>
  );
}
