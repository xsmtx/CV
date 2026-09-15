import { Portfolio } from "@/components/portfolio";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    alternateName: profile.name,
    url: profile.website,
    jobTitle: profile.specialization,
    email: profile.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Izmir",
      addressCountry: "TR",
    },
    sameAs: [profile.linkedin, profile.github],
    knowsAbout: [
      "Linux infrastructure",
      "Systems administration",
      "Automation",
      "Virtualization",
      "Incident response",
    ],
    alumniOf: profile.education.map((item) => ({
      "@type": "EducationalOrganization",
      name: item.school,
    })),
    subjectOf: projects.map((project) => ({
      "@type": "CreativeWork",
      name: project.fullName,
      description: project.summary,
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <Portfolio />
    </>
  );
}
