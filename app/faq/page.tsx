import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about So Sanh Xe car data, comparison logic, prices, votes, and comments.",
  alternates: {
    canonical: "/faq"
  }
};

const questions = [
  {
    question: "Why can specifications change over time?",
    answer:
      "Car data changes when manufacturers update variants, prices, safety packages, or equipment lists. We revise records when newer public information is available."
  },
  {
    question: "Why do you use one variant to represent a car line?",
    answer:
      "A comparison page works best when each car has one consistent set of values. For many models, we use a popular, high, or hybrid variant so the feature list is informative. Variant names are included in the car title when relevant."
  },
  {
    question: "Are prices on the site final on-road prices?",
    answer:
      "No. Prices are reference list prices unless stated otherwise. Registration fees, insurance, dealer promotions, color surcharges, and local charges can change the final on-road cost."
  },
  {
    question: "Why is a field shown as zero or a dash?",
    answer:
      "That usually means the value is unavailable or not confidently sourced. We prefer an explicit placeholder over an invented figure."
  },
  {
    question: "How does the comparison table decide which car is better?",
    answer:
      "Numeric fields use simple rules: lower is better for price, fuel consumption, turning radius, and weight; higher is better for output, dimensions, seats, and equipment counts. Text fields are neutral."
  },
  {
    question: "Do votes affect the technical comparison?",
    answer:
      "No. Votes show user preference for a pair of cars, but they do not change specifications or the highlighted comparison result."
  },
  {
    question: "Can I request a missing car?",
    answer:
      "Yes. Send the model name, market, model year, and any source links through the contact page."
  },
  {
    question: "How do I report incorrect data?",
    answer:
      "Use the contact page and include the car name, field name, current value, suggested value, and a public source link."
  }
];

export default function FaqPage() {
  return (
    <StaticPage title="Frequently Asked Questions" description="Short answers about how this car comparison project handles data, pricing, variants, votes, and corrections.">
      <ol className="toc-list">
        {questions.map((item, index) => (
          <li key={item.question}>
            <a href={`#q-${index + 1}`}>{item.question}</a>
          </li>
        ))}
      </ol>

      {questions.map((item, index) => (
        <section key={item.question} id={`q-${index + 1}`}>
          <h2>
            {index + 1}. {item.question}
          </h2>
          <p>{item.answer}</p>
        </section>
      ))}

      <p>
        Still need help? Visit the <Link href="/contact">contact page</Link>.
      </p>
    </StaticPage>
  );
}
