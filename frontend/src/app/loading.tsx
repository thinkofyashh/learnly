export default function Loading() {
  return (
    <div className="loading-grid" aria-label="Loading">
      {[1, 2, 3].map((item) => (
        <div className="loading-bar" key={item} />
      ))}
    </div>
  );
}
