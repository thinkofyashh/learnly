import { AdminPageHeader, DocumentTable, Pipeline } from "@/components/AdminViews";
import styles from "@/components/AdminViews.module.css";

export default function Processing() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Document operations"
        title="Processing center."
        body="Track each document through the pipeline and bring anything that needs attention back into focus."
      />
      <div className={styles.processingLayout}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>All documents</span>
              <h2>Processing queue</h2>
            </div>
          </div>
          <DocumentTable />
        </section>
        <aside className={`${styles.panel} ${styles.pipelinePanel}`}>
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
