import { systems } from "@/data/systems";

export function Systems({
  selected,
  select,
}: {
  selected: number;
  select: (index: number) => void;
}) {
  const system = systems[selected];
  return (
    <div className="scene-composition systems-composition">
      <div className="scene-title">
        <p className="scene-kicker">02 / CONNECTED BY DESIGN</p>
        <h2 id="heading-systems" tabIndex={-1}>
          SYSTEMS<span className="heading-dot">.</span>
        </h2>
        <p className="scene-intro">Complexity, made dependable.</p>
      </div>
      <div
        className="systems-selector"
        role="group"
        aria-label="Infrastructure domains"
      >
        {systems.map((item, index) => (
          <button
            key={item.id}
            className={`system-node ${index === selected ? "selected" : ""}`}
            onClick={() => select(index)}
            onMouseEnter={() => select(index)}
            onFocus={() => select(index)}
            aria-pressed={selected === index}
            data-cursor="OPEN"
          >
            <span className="system-node-marker" />
            <span>{item.name}</span>
            <span className="system-node-number">0{index + 1}</span>
          </button>
        ))}
      </div>
      <div
        className="domain-detail"
        aria-live="polite"
        aria-atomic="true"
        data-scroll-panel
        tabIndex={0}
        role="region"
        aria-label="System details"
      >
        <span className="detail-eyebrow">{system.level}</span>
        <h3>{system.caption}</h3>
        <p>{system.description}</p>
        <ul className="technology-list">
          {system.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
      <div className="scene-object-caption" aria-hidden="true">
        <span className="status-dot" /> {system.name.toUpperCase()} NODE
        SELECTED
      </div>
    </div>
  );
}
