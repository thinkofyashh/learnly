export default function Loading() {
  return (
    <div aria-label="Loading" style={{ display: "grid", gap: 16 }}>
      {[1, 2, 3].map((placeholderIndex) => (
        <div
          key={placeholderIndex}
          style={{
            height: 120,
            borderRadius: 16,
            background: "var(--surface-muted)",
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}
