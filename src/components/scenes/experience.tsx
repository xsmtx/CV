import { experience } from "@/data/experience";

export function ExperienceScene({
  selected,
  select,
}: {
  selected: number;
  select: (index: number) => void;
}) {
  const entry = experience[selected];
  return (
    <div className="scene-composition experience-composition">
      <div className="scene-title">
        <p className="scene-kicker">03 / AN EVOLVING TRAJECTORY</p>
        <h2 id="heading-experience" tabIndex={-1}>
          EXPERIENCE<span className="heading-dot">.</span>
        </h2>
        <p className="scene-intro">Built over time. Tested in production.</p>
      </div>
      <div className="era-display" aria-hidden="true">
        <span className="era-orbit" />
        <span className="era-year">{entry.year}</span>
        <span className="era-kind">{entry.kind}</span>
      </div>
      <div
        className="career-detail"
        aria-live="polite"
        aria-atomic="true"
        data-scroll-panel
        tabIndex={0}
        role="region"
        aria-label="Career details"
      >
        <p className="detail-eyebrow">
          {entry.period}
          <span className="entry-location">{entry.location}</span>
        </p>
        <h3>{entry.role}</h3>
        <p className="career-company">{entry.company}</p>
        <p>{entry.summary}</p>
        <ul className="responsibilities">
          {entry.responsibilities.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <ul className="technology-list">
          {entry.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
      <div
        className="timeline-scrubber"
        role="group"
        aria-label="Career timeline"
      >
        <div className="timeline-track" aria-hidden="true" />
        {experience.map((item, index) => (
          <button
            key={item.year}
            onClick={() => select(index)}
            aria-pressed={selected === index}
            aria-label={`${item.year}: ${item.role}`}
            className={selected === index ? "active" : ""}
            data-cursor="GO"
          >
            <span className="timeline-point" />
            <span>{item.year}</span>
            {index === 3 && <small>PARALLEL ROLE</small>}
          </button>
        ))}
      </div>
      <p className="timeline-note">
        Explore the years <span>← →</span>
        <span className="timeline-current">
          {String(selected + 1).padStart(2, "0")} / 05
        </span>
      </p>
    </div>
  );
}
