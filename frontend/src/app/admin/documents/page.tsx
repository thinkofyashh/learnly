import { DocumentTable, Pipeline } from "@/components/AdminViews";
import styles from "@/components/AdminViews.module.css";

export default function Processing() {
  return (
    <>
      <header className={styles.heading}>
        <span>Document operations</span>
        <h1>Processing center.</h1>
        <p>Track planned document stages and review items that need attention.</p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.5fr) minmax(280px,.5fr)",
          gap: 20,
          marginTop: 38,
        }}
      >
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>All documents</span>
              <h2>Processing queue</h2>
            </div>
          </div>
          <DocumentTable />
        </section>
        <aside className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Active pipeline</span>
              <h2>Docker Basics</h2>
            </div>
          </div>
          <Pipeline />
        </aside>
      </div>
    </>
  );
}
