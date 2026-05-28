import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "About",
  description: "About So Sanh Xe, a car comparison project for buyers who want clear specifications and pricing context.",
  alternates: {
    canonical: "/about"
  }
};

export default function AboutPage() {
  return (
    <StaticPage
      title="About So Sanh Xe"
      description="So Sanh Xe is a focused car comparison database built to help shoppers compare models with less noise and more structure."
      aside={
        <div className="rounded-lg border border-line bg-white p-4">
          <h2 className="text-sm font-bold uppercase text-ink">Core Tools</h2>
          <div className="mt-3 space-y-2 text-sm font-semibold text-muted">
            <Link href="/compare" className="block rounded-md px-2 py-2 hover:bg-surface hover:text-ink">
              Compare cars
            </Link>
            <Link href="/cars" className="block rounded-md px-2 py-2 hover:bg-surface hover:text-ink">
              Car database
            </Link>
          </div>
        </div>
      }
    >
      <h2>Our Purpose</h2>
      <p>
        Buying a car often means jumping between official brochures, dealer listings, news pages, owner comments, and pricing tables. So Sanh Xe brings the most useful comparison fields into one consistent format: price, dimensions, engine output, fuel consumption, comfort features, and safety systems.
      </p>

      <h2>Motivation</h2>
      <h3>Data is scattered</h3>
      <p>
        Vehicle information is usually split across many sources. We organize public specifications into a single model page and side-by-side comparison table.
      </p>

      <h3>Comparisons should be practical</h3>
      <p>
        A long specification sheet is not enough. The comparison table highlights which car is stronger in each measurable field, such as lower price, better fuel economy, larger wheelbase, or stronger output.
      </p>

      <h3>Local context matters</h3>
      <p>
        Pricing, variants, origin, and equipment can differ by market. This project prioritizes car data that is useful for Vietnamese buyers while keeping page content readable in English for static information pages.
      </p>

      <h2>How We Work</h2>
      <ul>
        <li>We collect and normalize public car specifications from manufacturer and automotive reference sources.</li>
        <li>We use one representative variant per car line when a comparison needs a compact overview.</li>
        <li>We keep unknown fields explicit instead of filling them with unsupported numbers.</li>
        <li>We update records when better source data becomes available.</li>
      </ul>
    </StaticPage>
  );
}
