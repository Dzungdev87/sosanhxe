import Link from "next/link";
import type { ReactNode } from "react";

type StaticPageProps = {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
};

const pageLinks = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" }
];

export function StaticPage({ title, description, children, aside }: StaticPageProps) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_280px]">
      <article className="rounded-lg border border-line bg-white p-5 sm:p-7">
        <nav className="mb-5 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-ink">{title}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{description}</p> : null}
        <div className="prose-static mt-7">{children}</div>
      </article>

      <aside className="space-y-4">
        <div className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-sm font-bold uppercase text-ink">Pages</h2>
          <div className="mt-3 space-y-2 text-sm font-semibold text-muted">
            {pageLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-md px-2 py-2 hover:bg-surface hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        {aside}
      </aside>
    </main>
  );
}
