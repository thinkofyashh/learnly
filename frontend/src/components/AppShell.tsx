"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PaperBloom } from "./PaperBloom";
import { SearchOverlay } from "./SearchOverlay";
import { ThemeToggle } from "./ThemeToggle";
import { UploadSheet } from "./UploadSheet";
import styles from "./AppShell.module.css";

const publicNavigation = [
  { href: "/", label: "Explore" },
  { href: "/notes", label: "Library" },
  { href: "/topics", label: "Topics" },
];

const adminNavigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/upload", label: "Add PDF" },
  { href: "/admin/documents", label: "Processing" },
  { href: "/admin/published", label: "Published" },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadSource, setUploadSource] = useState<"desktop" | "mobile">("desktop");
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const mobileUploadButtonRef = useRef<HTMLButtonElement>(null);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    function openFromKeyboard(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", openFromKeyboard);
    return () => window.removeEventListener("keydown", openFromKeyboard);
  }, []);

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
          <button
            ref={searchButtonRef}
            type="button"
            className={styles.searchAction}
            onClick={() => setSearchOpen(true)}
          >
            Search <kbd>⌘ K</kbd>
          </button>
          <ThemeToggle />
          <button
            ref={uploadButtonRef}
            type="button"
            className={styles.addAction}
            onClick={() => {
              setUploadSource("desktop");
              setUploadOpen(true);
            }}
          >
            <span aria-hidden>+</span> Add something
          </button>
        </div>
      </header>

      {searchOpen ? <SearchOverlay onClose={closeSearch} returnFocusRef={searchButtonRef} /> : null}
      {uploadOpen ? (
        <UploadSheet
          onClose={() => setUploadOpen(false)}
          returnFocusRef={uploadSource === "mobile" ? mobileUploadButtonRef : uploadButtonRef}
        />
      ) : null}

      <main className={styles.publicMain}>{children}</main>

      <footer className={styles.footer}>
        <Brand compact />
        <p>PDFs worth returning to, kept in one thoughtful place.</p>
        <div>
          <Link href="/notes">Library</Link>
          <Link href="/topics">Topics</Link>
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
        <Link href="/topics" className={path.startsWith("/topics") ? styles.mobileActive : ""}>
          Topics
        </Link>
        <button
          ref={mobileUploadButtonRef}
          type="button"
          className={styles.mobileAdd}
          onClick={() => {
            setUploadSource("mobile");
            setUploadOpen(true);
          }}
        >
          <span aria-hidden>+</span>
          Add
        </button>
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
        <p className={styles.railNote}>A private desk for preparing your public library.</p>
      </header>

      <div className={styles.workspaceIntro}>
        <span>Learnly studio</span>
        <p>Your private desk for preparing the public library.</p>
      </div>

      <main className={styles.adminMain}>{children}</main>

      <nav className={styles.mobileNav} aria-label="Mobile studio navigation">
        {adminNavigation.slice(0, 4).map((item) => (
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
