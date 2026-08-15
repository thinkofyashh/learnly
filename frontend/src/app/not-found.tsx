import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <div>
        <span>404 / LOST NOTE</span>
        <h1>This idea wandered off.</h1>
        <p>The page may have moved, or the note is not published yet.</p>
        <Link href="/notes">Return to the library ↗</Link>
      </div>
    </div>
  );
}
