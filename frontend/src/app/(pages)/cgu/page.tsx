import { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-server";
import Link from "next/link";

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: "Terms of Service",
    description:
      "Read our Terms of Service to understand the conditions for using the Minecraft Stats platform, user responsibilities, and your rights under the GDPR.",
    keywords: "terms of service, terms of use, GDPR, data protection, minecraft stats legal",
    openGraph: {
      title: "Terms of Service - Minecraft Stats",
      description:
        "Detailed Terms of Service for the Minecraft Stats platform. Learn about user responsibilities and the conditions for using the service.",
      type: "website",
      url: `${baseUrl}/cgu`,
    },
    alternates: {
      canonical: `${baseUrl}/cgu`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

const CGU = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">Legal</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: June 2, 2024</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">1. Legal Information</h2>
        <p>
          This website is published by Gabriel Landry. For any question or complaint, you can contact us by email at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">2. Purpose</h2>
        <p>
          These Terms of Service define the conditions of access to and use of the statistics services offered free of
          charge on the{" "}
          <Link href="/" className="font-medium text-accent hover:underline">
            Minecraft-Stats
          </Link>{" "}
          website. Any registration or use of the website implies full and unreserved acceptance of these Terms.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">3. Registration and User Account</h2>
        <p>To use our statistics collection and sharing service, users must:</p>
        <ul className="list-disc list-inside pl-4">
          <li>Create an account by providing a username, an email address, and a password.</li>
          <li>
            Alternatively, you may authenticate via Google or Discord, which may involve the collection of additional
            data such as your profile picture.
          </li>
        </ul>
        <p>No minimum age requirement applies to registration.</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
          4. Collection and Processing of Personal Data
        </h2>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Types of Data Collected</h3>
        <p>
          We collect and process only the data provided during registration: username, email address, and password. If
          you register via Google or Discord, additional information such as your profile picture may be collected.
        </p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Use of Data</h3>
        <p>The data is used to:</p>
        <ul className="list-disc list-inside pl-4">
          <li>Manage user accounts.</li>
          <li>Provide access to the website&apos;s services and features.</li>
          <li>Ensure the security and proper functioning of the website.</li>
        </ul>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Cookies and Local Storage</h3>
        <p>
          We use local storage to manage authentication. For more information, please refer to our{" "}
          <Link href="/privacy" className="font-medium text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">Data Storage and Security</h3>
        <p>The collected data is stored on a Pulseheberg VPS located in France.</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">User Rights</h3>
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
          To exercise these rights, please contact us at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>
          .
        </p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">No DPO</h3>
        <p>No Data Protection Officer (DPO) has been appointed.</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">5. Intellectual Property</h2>
        <p>
          Server images are the property of their respective Minecraft servers. All other content is the property of
          Gabriel Landry. The terms &quot;Minecraft&quot; and other associated trademarks belong to Mojang (Microsoft).
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
          6. User Obligations and Responsibilities
        </h2>
        <p>
          Users agree not to needlessly create a large number of servers. Any abuse may result in a ban from the
          platform.
        </p>
        <p>
          Users may add Minecraft servers so that statistics can be collected. By adding a server, the user warrants
          that they have the right to do so. We are not responsible if a user adds a server without holding that right.
          To remove a server, please contact us at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>{" "}
          with the subject &quot;Server removal request&quot;.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">7. Limitation of Liability</h2>
        <p>
          The website and its services are provided &quot;as is&quot; without any guarantee of continuous or
          uninterrupted operation. Gabriel Landry cannot be held liable for any malfunction or service interruption, nor
          for any potential data loss.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">8. Jurisdiction and Governing Law</h2>
        <p>
          These Terms are governed by the laws of Quebec. In the event of a dispute, and after an attempt at amicable
          resolution, the courts of Montreal (Quebec) shall have sole jurisdiction.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">9. Amendments to the Terms</h2>
        <p>
          Gabriel Landry reserves the right to modify these Terms at any time. Users will be informed of any change
          through a notification on the website. Continued use of the website after notification of the changes
          constitutes acceptance of the new Terms.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">10. Contact</h2>
        <p>
          For any question or complaint regarding these Terms, please contact us at:{" "}
          <a href="mailto:gablandry31@gmail.com" className="font-medium text-accent hover:underline">
            gablandry31@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">Privacy</h2>
        <p>
          For details on how we collect, use, and protect your personal data, including third-party services such as
          analytics and advertising, please read our dedicated{" "}
          <Link href="/privacy" className="font-medium text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
};

export default CGU;
