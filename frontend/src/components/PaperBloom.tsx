import styles from "./PaperBloom.module.css";

export function PaperBloom({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.bloom} ${compact ? styles.compact : ""}`} aria-hidden>
      <span className={`${styles.sheet} ${styles.sheetOne}`} />
      <span className={`${styles.sheet} ${styles.sheetTwo}`} />
      <span className={`${styles.sheet} ${styles.sheetThree}`} />
      <span className={`${styles.sheet} ${styles.sheetFour}`} />
      <span className={styles.core}>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
