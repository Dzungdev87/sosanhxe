import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for So Sanh Xe, including information about logs, cookies, comments, votes, and contact messages."
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy" description="This policy explains what information may be collected when you use So Sanh Xe and how it is used.">
      <p>Last updated: May 23, 2026</p>

      <h2>Information We Collect</h2>
      <p>
        When you visit the site, standard server logs may include your IP address, browser type, referring page, visited pages, and timestamps. If you vote, comment, or contact us, we may process the information needed to provide those features.
      </p>

      <h2>Comments and Votes</h2>
      <p>
        Votes and comments may use a hashed IP value or similar technical identifier to prevent duplicate submissions, reduce spam, and moderate abuse. Public comments may display the name and message you submit.
      </p>

      <h2>Cookies and Analytics</h2>
      <p>
        The site may use cookies or privacy-conscious analytics to understand traffic patterns, improve pages, and protect the service. You can disable cookies in your browser settings, although some features may work less smoothly.
      </p>

      <h2>How We Use Information</h2>
      <ul>
        <li>To operate comparison, voting, comment, and admin features.</li>
        <li>To detect spam, abuse, or technical errors.</li>
        <li>To improve content quality and user experience.</li>
        <li>To respond to messages sent through the contact page.</li>
      </ul>

      <h2>Sharing Information</h2>
      <p>
        We do not sell personal information. We may share limited information with hosting, database, security, or analytics providers that help operate the site, or when required by law.
      </p>

      <h2>Data Retention</h2>
      <p>
        Operational logs, votes, comments, and contact messages may be kept as long as needed for moderation, security, troubleshooting, and service improvement.
      </p>

      <h2>Your Choices</h2>
      <p>
        You may request correction or deletion of information you submitted by contacting us. We may need enough detail to identify the relevant record.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, email <a href="mailto:contact@sosanhxe.local">contact@sosanhxe.local</a>.
      </p>
    </StaticPage>
  );
}
