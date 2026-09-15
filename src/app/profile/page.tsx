import Link from "next/link";
import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { experience } from "@/data/experience";
import { systems } from "@/data/systems";
import { projects } from "@/data/projects";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { terminalProfile } from "@/data/terminal";

export const metadata: Metadata = {
  title: "Profile, experience & projects",
  description: profile.about,
  alternates: { canonical: "/profile/" },
};

export default function ProfilePage() {
  return (
    <div className="readable-profile">
      <header>
        <Link className="brand-mark" href="/">
          S.K
        </Link>
        <div className="header-actions">
          <Link className="back-to-space" href="/">
            RETURN TO SPACE ↗
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <p className="scene-kicker">THE COMPLETE PROFILE</p>
        <h1>{profile.fullName}</h1>
        <p className="profile-title">{profile.specialization}</p>
        <p>{profile.location}</p>
        <p className="profile-summary">{profile.about}</p>
        <nav aria-label="Profile sections">
          <a href={terminalProfile.cvUrl} download={terminalProfile.cvFilename}>
            Download CV (PDF)
          </a>
          <a href="#expertise">Systems</a>
          <a href="#career">Experience</a>
          <a href="#work">Projects</a>
          <a href="#education">Education</a>
          <a href="#connect">Contact</a>
        </nav>
        <section id="expertise">
          <h2>Systems & expertise</h2>
          {systems.map((system) => (
            <article key={system.id}>
              <h3>{system.name}</h3>
              <p className="detail-eyebrow">{system.level}</p>
              <p>{system.description}</p>
              <ul className="technology-list">
                {system.technologies.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
        <section id="career">
          <h2>Experience</h2>
          {[...experience].reverse().map((entry) => (
            <article key={entry.year}>
              <p className="detail-eyebrow">
                {entry.period} / {entry.location}
              </p>
              <h3>{entry.role}</h3>
              <p className="career-company">{entry.company}</p>
              <p>{entry.summary}</p>
              <ul>
                {entry.responsibilities.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
        <section id="work">
          <h2>Selected projects</h2>
          {projects.map((project) => (
            <article key={project.id}>
              <p className="detail-eyebrow">{project.category}</p>
              <h3>{project.fullName}</h3>
              <p>{project.summary}</p>
              <p>
                <strong>Role:</strong> {project.role}
              </p>
              <p>{project.architecture}</p>
              <p>{project.result}</p>
              <ul className="technology-list">
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
        <section id="education">
          <h2>Education</h2>
          {profile.education.map((item) => (
            <article key={item.school}>
              <p className="detail-eyebrow">{item.period}</p>
              <h3>{item.school}</h3>
              <p>{item.subject}</p>
            </article>
          ))}
        </section>
        <section id="connect">
          <h2>Let’s build better systems.</h2>
          <a className="profile-email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className="social-links">
            <a href={profile.linkedin}>LinkedIn ↗</a>
            <a href={profile.github}>GitHub ↗</a>
          </div>
        </section>
      </main>
      <footer>
        <span>© 2026 Samet Kabakci</span>
        <Link href="/">Return to the spatial experience ↗</Link>
      </footer>
    </div>
  );
}
