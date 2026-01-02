import { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: "About Us",
    description:
      "Learn about our mission to provide transparent, public, and free comparison of Minecraft servers based on objective data. Discover how we help players find and compare servers.",
    keywords: "about, minecraft stats, server comparison, transparency, minecraft server list, fair ranking",
    openGraph: {
      title: "About Us - Minecraft Stats",
      description:
        "Our platform provides transparent, public, and free comparison of Minecraft servers based on objective and accessible data.",
      type: "website",
      url: `${baseUrl}/about`,
    },
    alternates: {
      canonical: `${baseUrl}/about`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

const About = () => {
  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">About</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">About Us</h2>
        <p className="mb-4">Our platform was created with a simple goal:</p>
        <p className="mb-4">
          to provide <strong>a transparent, public, and free comparison of Minecraft servers</strong>, based on
          objective and accessible data.
        </p>
        <p className="mb-4">
          Unlike traditional server lists whose primary purpose is promotion, our main focus is{" "}
          <strong>comparison and visibility</strong>.
        </p>
        <p className="mb-4">
          We aim to help players understand how servers perform, how active they are, and how they evolve over time,
          using clear metrics such as player activity and trends.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">A Tool for Players First</h2>
        <p className="mb-4">
          Minecraft has thousands of servers, but reliable and neutral information is often hard to find.
        </p>
        <p className="mb-2">Our platform allows players to:</p>
        <ul className="list-disc list-inside pl-4 mb-4">
          <li>Compare servers using public and consistent criteria</li>
          <li>Track player activity and trends over time</li>
          <li>Get a clearer view of the Minecraft server ecosystem</li>
        </ul>
        <p className="mb-4">Discovery is naturally part of the experience, but it is <strong>not our primary objective</strong>.</p>
        <p className="mb-4">
          Our priority is to give players a <strong>fair and unbiased overview</strong>, not to push specific servers
          to the top.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Transparency &amp; Fair Ranking</h2>
        <p className="mb-4">
          All rankings and statistics are generated using the same methodology for every server.
        </p>
        <p className="mb-4">
          No server can artificially improve its position in the rankings through payment or promotion.
        </p>
        <p className="mb-2">
          In the future, we may offer <strong>optional promotional visibility</strong> for server owners (such as
          dedicated display areas), but:
        </p>
        <ul className="list-disc list-inside pl-4 mb-4">
          <li>
            promotional content will always be <strong>clearly identified</strong>, and
          </li>
          <li>
            it will <strong>never influence rankings or statistics</strong>.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">An Evolving Project</h2>
        <p className="mb-4">This platform is continuously evolving.</p>
        <p className="mb-4">
          We improve data accuracy, performance, and user experience based on feedback from the community and ongoing
          technical development.
        </p>
        <p className="mb-4">Our objective is long-term:</p>
        <p className="mb-4">
          to remain a <strong>useful, trustworthy, and independent reference</strong> for Minecraft players worldwide.
        </p>
        <p className="mb-4">If you have questions, suggestions, or feedback, feel free to contact us.</p>
      </section>
    </div>
  );
};

export default About;
