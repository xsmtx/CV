"use client";

import { useState } from "react";
import { profile } from "@/data/profile";
import { Arrow, CopyIcon } from "@/components/ui/icons";

export function Contact() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">(
    "idle",
  );
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }
  return (
    <div className="contact-composition">
      <p className="scene-kicker">06 / THE NEXT CONNECTION</p>
      <h2 id="heading-contact" tabIndex={-1}>
        LET’S BUILD
        <br />
        BETTER
        <br />
        SYSTEMS<span className="heading-dot">.</span>
      </h2>
      <p className="contact-intro">
        Have a complex problem in mind?
        <br />
        Let’s find a thoughtful way forward.
      </p>
      <div className="contact-links">
        <a
          href={`mailto:${profile.email}`}
          className="email-link"
          data-cursor="OPEN"
        >
          {profile.email}
          <Arrow diagonal />
        </a>
        <button
          onClick={copyEmail}
          className="copy-email"
          aria-label="Copy email address"
        >
          <CopyIcon />
          <span>{copyState === "copied" ? "COPIED" : "COPY EMAIL"}</span>
        </button>
        <div className="social-links">
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            LINKEDIN
            <Arrow diagonal />
          </a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            GITHUB
            <Arrow diagonal />
          </a>
        </div>
      </div>
      <p className="copy-feedback" role="status">
        {copyState === "copied"
          ? "Email address copied."
          : copyState === "manual"
            ? `Select and copy: ${profile.email}`
            : ""}
      </p>
      <p className="contact-signoff">BASED IN İZMİR. CONNECTED EVERYWHERE.</p>
    </div>
  );
}
