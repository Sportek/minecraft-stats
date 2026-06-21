import { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-server";
import Link from "next/link";

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: "Privacy Policy",
    description:
      "Learn what data Minecraft Stats collects, how we use cookies, the third-party services we rely on (Google Analytics, Google AdSense), your GDPR rights, and how to contact us.",
    keywords: "privacy policy, GDPR, data protection, cookies, google analytics, google adsense, minecraft stats",
    openGraph: {
      title: "Privacy Policy - Minecraft Stats",
      description:
        "How Minecraft Stats collects and processes data, the cookies and third-party services it uses, and your privacy rights.",
      type: "website",
      url: `${baseUrl}/privacy`,
    },
    alternates: {
      canonical: `${baseUrl}/privacy`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

const Privacy = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">Legal</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: June 21, 2026</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Overview</h2>
        <p>
          Minecraft Stats is a free, open-source platform for tracking Minecraft server statistics. We try to collect as
          little personal data as possible and to be transparent about what we do collect. This policy explains what
          data we process, why, and the rights you have over it. It complements our{" "}
          <Link href="/cgu" className="font-medium text-accent hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Data We Collect</h2>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Account Data</h3>
        <p>
          When you create an account, we store the username, email address, and password you provide. Passwords are
          hashed and never stored in plain text. If you sign in via Google or Discord, we may also receive basic profile
          information such as your display name and profile picture from that provider.
        </p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Content You Submit</h3>
        <p>
          If you add a Minecraft server, we store the server details you provide (such as its address and name) so we
          can ping it and display its statistics. This data is public by nature.
        </p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Usage and Analytics Data</h3>
        <p>
          Like most websites, we automatically receive certain technical information (such as your IP address, browser
          type, and the pages you visit) and use analytics tools to understand how the site is used. See the
          third-party services section below for details.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">How We Use Your Data</h2>
        <ul className="list-disc list-inside pl-4">
          <li>To create and manage your account and authenticate you.</li>
          <li>To provide the platform&apos;s features, including server statistics.</li>
          <li>To measure audience and improve the website&apos;s performance and content.</li>
          <li>To display advertising that helps keep the service free.</li>
          <li>To ensure the security and proper functioning of the website.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Cookies and Local Storage</h2>
        <p>
          We use browser local storage to keep you signed in. Our third-party providers (analytics and advertising) may
          also set cookies or similar identifiers on your device. You can control or delete cookies through your browser
          settings, and you can manage advertising preferences as described below. Disabling some cookies may affect how
          parts of the site work.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Third-Party Services</h2>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Google Analytics 4</h3>
        <p>
          We use Google Analytics 4 to measure audience and understand how visitors use the site. Google Analytics sets
          cookies and assigns identifiers to recognize returning visitors, and processes data such as your IP address.
          IP addresses are handled by Google in accordance with its policies and may be anonymized or truncated. This
          helps us see aggregate trends rather than identify individuals.
        </p>
        <p className="mt-2">
          For more information, see{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google&apos;s Privacy Policy
          </a>
          . You can opt out of Google Analytics across websites using the{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google Analytics Opt-out Browser Add-on
          </a>
          .
        </p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Google AdSense</h3>
        <p>
          We use Google AdSense to display advertising, which helps keep Minecraft Stats free. Google and its partners
          may use cookies and similar identifiers to serve ads and, where applicable, to personalize them based on your
          activity. We do not control the specific ads shown.
        </p>
        <p className="mt-2">
          You can review and control how Google personalizes ads, and opt out of personalized advertising, through your{" "}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google Ads Settings
          </a>
          . More information is available in{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google&apos;s advertising policies
          </a>
          .
        </p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Authentication Providers</h3>
        <p>
          If you sign in with Google or Discord, those providers process your data under their own privacy policies. We
          only receive the basic profile information needed to create and identify your account.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Data Storage and Security</h2>
        <p>
          Account and server data is stored on a Pulseheberg VPS located in France. We apply reasonable technical
          measures to protect your data against unauthorized access. No method of transmission or storage is completely
          secure, but we take security seriously.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Data Retention</h2>
        <p>
          We keep your personal data for as long as your account is active and the services are provided. If you delete
          your account or ask us to remove your data, we will delete it unless we are required to retain it for legal
          reasons. Aggregate, anonymized statistics may be kept indefinitely.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Your Rights</h2>
        <p>In accordance with the GDPR, you have the following rights over your personal data:</p>
        <ul className="list-disc list-inside pl-4">
          <li>Right of access</li>
          <li>Right to rectification</li>
          <li>Right to erasure</li>
          <li>Right to restriction of processing</li>
          <li>Right to object</li>
          <li>Right to data portability</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>
          . No Data Protection Officer (DPO) has been appointed.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Contact</h2>
        <p>
          For any question about this Privacy Policy or how your data is handled, reach us at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>{" "}
          or through our{" "}
          <Link href="/contact" className="font-medium text-accent hover:underline">
            contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
};

export default Privacy;
