import { profile } from "@/data/profile";
import { Arrow } from "@/components/ui/icons";

export function Home({ enter }: { enter: () => void }) {
  return (
    <div className="home-composition">
      <div className="home-heading">
        <p className="scene-kicker">
          <span className="signal-line" /> SYSTEM ENGINEER
        </p>
        <h1
          className="identity"
          id="heading-home"
          tabIndex={-1}
          aria-label="Samet Kabakci"
        >
          <span>SAMET</span>
          <span>
            KABAKCI<span className="identity-period">.</span>
          </span>
        </h1>
        <div className="identity-disciplines">
          SYSTEMS <span>/</span> CLOUD <span>/</span> INFRASTRUCTURE{" "}
          <span>/</span> AUTOMATION
        </div>
      </div>
      <div className="home-introduction">
        <p>{profile.introduction}</p>
        <p>{profile.summary}</p>
      </div>
      <button className="enter-world" onClick={enter} data-cursor="GO">
        <span className="enter-orbit">
          <Arrow />
        </span>
        <span>
          ENTER THE SYSTEM
          <span className="button-subtitle">SCROLL TO EXPLORE</span>
        </span>
      </button>
      <div className="world-annotation" aria-hidden="true">
        <span className="annotation-cross">+</span>
        <div>
          INFRASTRUCTURE ECOSYSTEM<span>PROCEDURAL OBJECT / 001</span>
        </div>
        <span className="annotation-line" />
      </div>
      <span className="edition" aria-hidden="true">
        INDEPENDENT PORTFOLIO — 2026
      </span>
    </div>
  );
}
