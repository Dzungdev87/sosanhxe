import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact So Sanh Xe for data corrections, car requests, feedback, and partnership questions.",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" description="For questions, corrections, car requests, or suggestions, send a message with as much source context as possible.">
      <p>
        Email:{" "}
        <a href="mailto:contact@sosanhcar.com" className="font-semibold">
          contact@sosanhcar.com
        </a>
      </p>

      <h2>Feedback Form</h2>
      <form action="mailto:contact@sosanhcar.com" method="post" encType="text/plain" className="mt-4 max-w-2xl space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">Name*</span>
          <input name="name" required className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">E-mail*</span>
          <input name="email" type="email" required className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">Message*</span>
          <textarea name="message" required rows={7} className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good" />
        </label>
        <button type="submit" className="rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-good">
          Submit
        </button>
      </form>

      <h2>What to include</h2>
      <ul>
        <li>Car name, model year, and market.</li>
        <li>The field that needs to be added or corrected.</li>
        <li>A public source link, preferably from a manufacturer or trusted automotive database.</li>
        <li>A short note explaining the issue.</li>
      </ul>
    </StaticPage>
  );
}
