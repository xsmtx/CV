import { projects } from "@/data/projects";
import { Arrow } from "@/components/ui/icons";

export function Projects({
  selected,
  select,
  open,
  setOpen,
}: {
  selected: number;
  select: (index: number) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const project = projects[selected];
  return (
    <div
      className={`scene-composition projects-composition ${open ? "project-open" : ""}`}
    >
      <div className="scene-title">
        <p className="scene-kicker">04 / FROM ARCHITECTURE TO REALITY</p>
        <h2 id="heading-projects" tabIndex={-1}>
          PROJECTS<span className="heading-dot">.</span>
        </h2>
        <p className="scene-intro">Ideas with infrastructure beneath them.</p>
      </div>
      <div className="project-index" role="group" aria-label="Choose a project">
        {projects.map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
              select(index);
              setOpen(false);
            }}
            className={selected === index ? "selected" : ""}
            aria-pressed={selected === index}
            aria-label={`${item.number}: ${item.fullName}`}
            data-cursor="VIEW"
          >
            <span>{item.number}</span>
            <span>{item.fullName}</span>
            <span className="project-index-dot" />
          </button>
        ))}
      </div>
      <div className="project-content" data-scroll-panel>
        <p className="detail-eyebrow">
          PROJECT {project.number}{" "}
          <span className="project-category">{project.category}</span>
        </p>
        <h3>{project.name}</h3>
        <p className="project-summary">{project.summary}</p>
        <ul className="technology-list">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <button
          className="text-action"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="project-architecture"
          data-cursor={open ? "BACK" : "VIEW"}
        >
          {open ? "CLOSE EXPLORATION" : "EXPLORE PROJECT"}
          <Arrow />
        </button>
        <div
          id="project-architecture"
          hidden={!open}
          className="project-architecture"
        >
          <div>
            <h4>ROLE</h4>
            <p>
              {project.role}{" "}
              <span className="muted">/ {project.organization}</span>
            </p>
          </div>
          <div>
            <h4>CHALLENGE</h4>
            <p>{project.challenge}</p>
          </div>
          <div>
            <h4>ARCHITECTURE</h4>
            <p>{project.architecture}</p>
          </div>
          <div>
            <h4>OUTCOME</h4>
            <p>{project.result}</p>
          </div>
        </div>
      </div>
      <span className="project-orbit-label" aria-hidden="true">
        {project.number}
        <span>/ 04</span>
      </span>
    </div>
  );
}
