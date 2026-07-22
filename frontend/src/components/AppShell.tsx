"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "./ThemeToggle";
import styles from "./AppShell.module.css";

type IconName = "home" | "library" | "admin" | "upload" | "process";

const publicNavigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/notes", label: "Library", icon: "library" },
  { href: "/admin", label: "Studio", icon: "admin" },
];

const adminNavigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/upload", label: "Upload", icon: "upload" },
  { href: "/admin/documents", label: "Processing", icon: "process" },
  { href: "/notes", label: "Public library", icon: "library" },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`${styles.brand} ${compact ? styles.compactBrand : ""}`}>
      <span className={styles.mark} aria-hidden>
        L
      </span>
      <span>
        Learnly<em>.</em>
      </span>
    </Link>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    library: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      </>
    ),
    admin: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 15v5h16v-5" />
      </>
    ),
    process: (
      <>
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v6h-6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      {paths[name]}
    </svg>
  );
}

function RouteContent({
  children,
  className,
}: {
  children: React.ReactNode;
  path: string;
  className: string;
}) {
  return <main className={className}>{children}</main>;
}

function PublicShell({ children, path }: { children: React.ReactNode; path: string }) {
  return (
    <div className={styles.publicShell}>
      <header className={styles.publicHeader}>
        <Brand />
        <nav className={styles.publicNav} aria-label="Primary navigation">
          {publicNavigation.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? styles.publicActive : ""}>
                {item.label}
                {active && <span className={styles.navIndicator} />}
              </Link>
            );
          })}
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.upload} href="/admin/upload">
            Upload note <span aria-hidden>↗</span>
          </Link>
        </div>
      </header>
      <RouteContent path={path} className={styles.publicMain}>
        {children}
      </RouteContent>
      <footer className={styles.footer}>
        <Brand compact />
        <p>A living library for curious minds.</p>
        <span>© 2026 Learnly</span>
      </footer>
      <nav className={styles.publicMobileNav} aria-label="Mobile navigation">
        {publicNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={path === item.href ? styles.mobileActive : ""}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function AdminShell({ children, path }: { children: React.ReactNode; path: string }) {
  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <Brand />
        <p className={styles.eyebrow}>Learning studio</p>
        <nav aria-label="Admin navigation">
          {adminNavigation.map((item) => {
            const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
                {active && <span className={styles.adminIndicator} />}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <span className={styles.statusDot} />
          <div>
            <strong>Frontend preview</strong>
            <small>Mock library data</small>
          </div>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.adminHeader}>
          <Brand compact />
          <div>
            <span className={styles.kicker}>Midnight Studio</span>
            <strong>Your knowledge workspace</strong>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <Link className={styles.upload} href="/admin/upload">
              New document <span aria-hidden>+</span>
            </Link>
          </div>
        </header>
        <RouteContent path={path} className={styles.adminMain}>
          {children}
        </RouteContent>
        <nav className={styles.adminMobileNav} aria-label="Mobile admin navigation">
          {adminNavigation.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={path === item.href ? styles.mobileActive : ""}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
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
