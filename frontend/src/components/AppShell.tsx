"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PaperBloom } from "./PaperBloom";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./AppShell.module.css";

const publicNavigation = [
  { href: "/", label: "Explore" },
  { href: "/notes", label: "Library" },
];

const adminNavigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/upload", label: "Add PDF" },
  { href: "/admin/documents", label: "Processing" },
  { href: "/notes", label: "Public library" },
];

function isActivePath(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  if (href === "/admin") return path === "/admin";
  return path.startsWith(href);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`${styles.brand} ${compact ? styles.compactBrand : ""}`}>
      <PaperBloom compact />
      <span>Learnly</span>
    </Link>
  );
}

function PublicShell({ children, path }: { children: React.ReactNode; path: string }) {
  return (
    <div className={styles.publicShell}>
      <header className={styles.publicHeader}>
        <Brand />
        <nav className={styles.publicNav} aria-label="Primary navigation">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(path, item.href) ? styles.active : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <Link href="/notes" className={styles.searchAction}>
            Search <kbd>⌘ K</kbd>
          </Link>
          <ThemeToggle />
          <Link className={styles.addAction} href="/admin/upload">
            <span aria-hidden>+</span> Add something
          </Link>
        </div>
      </header>

      <main className={styles.publicMain}>{children}</main>

      <footer className={styles.footer}>
        <Brand compact />
        <p>PDFs worth returning to, kept in one thoughtful place.</p>
        <div>
          <Link href="/notes">Library</Link>
          <Link href="/admin">Studio</Link>
          <span>© 2026 Learnly</span>
        </div>
      </footer>

      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <Link href="/" className={path === "/" ? styles.mobileActive : ""}>
          Explore
        </Link>
        <Link href="/notes" className={path.startsWith("/notes") ? styles.mobileActive : ""}>
          Library
        </Link>
        <Link href="/admin/upload" className={styles.mobileAdd}>
          <span aria-hidden>+</span>
          Add
        </Link>
        <Link href="/admin" className={path.startsWith("/admin") ? styles.mobileActive : ""}>
          Studio
        </Link>
      </nav>
    </div>
  );
}

function AdminShell({ children, path }: { children: React.ReactNode; path: string }) {
  return (
    <div className={styles.adminShell}>
      <header className={styles.adminHeader}>
        <Brand />
        <nav className={styles.adminNav} aria-label="Studio navigation">
          {adminNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(path, item.href) ? styles.active : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.addAction} href="/admin/upload">
            <span aria-hidden>+</span> Add PDF
          </Link>
        </div>
      </header>

      <div className={styles.workspaceIntro}>
        <span>Learnly studio</span>
        <p>Your private desk for preparing the public library.</p>
      </div>

      <main className={styles.adminMain}>{children}</main>

      <nav className={styles.mobileNav} aria-label="Mobile studio navigation">
        {adminNavigation.slice(0, 3).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActivePath(path, item.href) ? styles.mobileActive : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return path.startsWith("/admin") ? (
    <AdminShell path={path}>{children}</AdminShell>
  ) : (
    <PublicShell path={path}>{children}</PublicShell>
  );
}
