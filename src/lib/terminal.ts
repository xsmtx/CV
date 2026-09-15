import { profile, scenes, type SceneId } from "@/data/profile";
import { systems } from "@/data/systems";
import { projects } from "@/data/projects";
import { experience } from "@/data/experience";
import { terminalProfile } from "@/data/terminal";
import type { Theme } from "@/lib/theme";

export interface ShellContext {
  now: Date;
  sessionStartedAt: number;
  theme: Theme;
  scene: SceneId;
  history: string[];
  graphics: string;
  fps: number;
  paused: boolean;
}
export type ShellAction =
  | { type: "download" }
  | { type: "theme"; value: Theme }
  | { type: "open"; scene: SceneId }
  | { type: "clear" }
  | { type: "exit" };
export interface ShellResult {
  text: string;
  error?: boolean;
  action?: ShellAction;
}

/** Calendar arithmetic: clamp anniversaries to month end, never divide by 365. */
export function calendarAge(birthDate: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))
    throw new RangeError("Invalid birth date");
  const [year, month, day] = birthDate.split("-").map(Number);
  const born = Date.UTC(year, month - 1, day);
  if (new Date(born).toISOString().slice(0, 10) !== birthDate)
    throw new RangeError("Invalid birth date");
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    Number(date.find((item) => item.type === type)!.value);
  const end = Date.UTC(part("year"), part("month") - 1, part("day"));
  if (end < born) throw new RangeError("Birth date is in the future");
  const anniversary = (months: number) => {
    const first = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth(),
      Math.min(day, lastDay),
    );
  };
  let months = (part("year") - year) * 12 + part("month") - month;
  if (anniversary(months) > end) months--;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: Math.floor((end - anniversary(months)) / 86400000),
    totalDays: Math.floor((end - born) / 86400000),
  };
}

const usage = (text: string): ShellResult => ({
  text: `Usage: ${text}`,
  error: true,
});
const about = () =>
  `${profile.fullName}\n${profile.specialization}\n${profile.location}\n\n${profile.about}\n\n${profile.summary}`;
const contact = () =>
  `Email     ${profile.email}\nLocation  ${profile.location}\nWebsite   ${profile.website}\nGitHub    ${profile.github}\nLinkedIn  ${profile.linkedin}`;
const career = () =>
  [...experience]
    .reverse()
    .map(
      (item) =>
        `${item.period} | ${item.role}\n${item.company}\n${item.summary}`,
    )
    .join("\n\n");
const skillList = () =>
  systems
    .map(
      (item) =>
        `${item.id.padEnd(12)} ${item.name}\n             ${item.level}\n             ${item.technologies.join(", ")}`,
    )
    .join("\n\n");
const projectList = () =>
  projects
    .map(
      (item) => `${item.id}\n  ${item.fullName}\n  ${item.stack.join(" / ")}`,
    )
    .join("\n\n");

export const completionCommands = [
  "help",
  "whoami",
  "uptime",
  "uptime --session",
  "uname -a",
  "neofetch",
  "pwd",
  "ls",
  "ls skills/",
  "ls projects/",
  "cat about.txt",
  "cat contact.txt",
  "cat experience.log",
  "skills",
  ...systems.map((s) => `skills ${s.id}`),
  "projects",
  ...projects.map((p) => `projects ${p.id}`),
  "experience",
  "contact",
  "curl CV",
  "curl -O CV",
  "wget CV",
  "date",
  "status",
  "theme dark",
  "theme light",
  ...scenes.map((s) => `open ${s.id}`),
  "history",
  "clear",
  "exit",
];
export function completeCommand(input: string) {
  const prefix = input.trimStart().toLowerCase();
  if (!prefix) return [];
  return completionCommands.filter((command) =>
    command.toLowerCase().startsWith(prefix),
  );
}

export function executeCommand(
  input: string,
  context: ShellContext,
): ShellResult {
  const [rawCommand, ...args] = input.trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  const arg = args.join(" ").toLowerCase();
  switch (command) {
    case "help":
      return {
        text: `SAMET / PORTFOLIO SHELL\nExplore my work through familiar commands.\n\nwhoami             Name and role\nuptime             Age in calendar years, months and days\nuptime --session   Time in this browser session\nneofetch           Profile overview\nskills [domain]    Technical skills and experience levels\nprojects [id]      Projects and architecture\nexperience         Career timeline\ncontact            Public contact details\nls / pwd / cat     Browse the profile files\ncurl CV            Download my CV as a Word document\nstatus             Current browser and scene status\ndate               Local time in Izmir\ntheme dark|light   Change the site's theme\nopen <space>       Travel to a space\nhistory            Commands in this session\nclear / exit       Clear the screen or close the terminal\n\nTry: skills linux · projects scb · cat about.txt\nSpaces: ${scenes.map((s) => s.id).join(", ")}\n\n↑ ↓ history · Tab completes a unique match\nCtrl+L clears · Ctrl+C cancels input · Esc closes`,
      };
    case "whoami":
      return { text: `${profile.fullName}\n${profile.title}` };
    case "uptime": {
      if (arg === "--session") {
        const seconds = Math.max(
          0,
          Math.floor((context.now.getTime() - context.sessionStartedAt) / 1000),
        );
        return {
          text: `Browser session: ${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`,
        };
      }
      if (arg) return usage("uptime [--session]");
      if (!terminalProfile.birthDate)
        return { text: "Birth date has not been configured yet.", error: true };
      const age = calendarAge(terminalProfile.birthDate, context.now);
      const unit = (value: number, label: string) =>
        `${value} ${label}${value === 1 ? "" : "s"}`;
      return {
        text: `${profile.fullName} / uptime\n${unit(age.years, "year")} · ${unit(age.months, "month")} · ${unit(age.days, "day")}\n${age.totalDays.toLocaleString("en-GB")} days since boot. Still learning.`,
      };
    }
    case "neofetch":
      return {
        text: `S.K / SYSTEM ENGINEER\n──────────────────────────────\n${profile.fullName}\n${profile.specialization}\n\nBase       ${profile.location}\nFocus      Linux / Infrastructure / Automation\nPractice   Production operations & team leadership\nLearning   Cloud / IaC / Kubernetes fundamentals\nContact    ${profile.email}`,
      };
    case "uname":
      return arg === "-a" || !arg
        ? {
            text: `${profile.specialization}\nLinux systems · Hosting platforms · Reliability · Technical leadership`,
          }
        : usage("uname -a");
    case "pwd":
      return { text: "/home/samet/portfolio" };
    case "ls":
      if (!arg || arg === "." || arg === "~")
        return {
          text: "about.txt\ncontact.txt\nexperience.log\nskills/\nprojects/\nCV.docx\n\nRead a file with cat, or download the CV with curl CV.",
        };
      if (/^skills\/?$/.test(arg))
        return {
          text: systems.map((s) => s.id).join("\n") + "\n\nTry: skills linux",
        };
      if (/^projects\/?$/.test(arg)) return { text: projectList() };
      return {
        text: `ls: no such profile directory: ${args.join(" ")}`,
        error: true,
      };
    case "cat":
      if (arg === "about.txt") return { text: about() };
      if (arg === "contact.txt") return { text: contact() };
      if (arg === "experience.log") return { text: career() };
      if (arg === "cv.docx")
        return {
          text: "CV.docx is a Word document. Use curl CV to download it.",
        };
      return { text: `cat: unknown profile file. Try ls.`, error: true };
    case "skills": {
      if (!arg) return { text: skillList() };
      const skill = systems.find((s) => s.id === arg);
      return skill
        ? {
            text: `${skill.name}\n${skill.level}\n\n${skill.description}\n\n${skill.technologies.join("\n")}`,
          }
        : usage(`skills [${systems.map((s) => s.id).join(" | ")}]`);
    }
    case "projects": {
      if (!arg) return { text: projectList() };
      const project = projects.find((p) => p.id === arg);
      return project
        ? {
            text: `${project.fullName}\n${project.role}\n\n${project.summary}\n\nArchitecture\n${project.architecture}\n\nOutcome\n${project.result}\n\nStack: ${project.stack.join(" / ")}`,
          }
        : usage(`projects [${projects.map((p) => p.id).join(" | ")}]`);
    }
    case "experience":
      return { text: career() };
    case "contact":
      return { text: contact() };
    case "curl":
    case "wget":
      return /^(?:-o )?cv(?:\.docx)?$/.test(arg)
        ? {
            text: `Fetching ${terminalProfile.cvFilename}…`,
            action: { type: "download" },
          }
        : usage(`${command} CV`);
    case "date":
      return {
        text:
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Istanbul",
            dateStyle: "full",
            timeStyle: "long",
          }).format(context.now) + "\nEurope/Istanbul",
      };
    case "status":
      return {
        text: `PORTFOLIO / BROWSER SESSION\nScene     ${context.scene}\nTheme     ${context.theme}\nGraphics  ${context.graphics}\nMotion    ${context.paused ? "Paused" : "Running"}\n${context.graphics === "WEBGL" && !context.paused ? `Measured  ${context.fps} FPS\n` : ""}\nThese values describe this browser view.`,
      };
    case "theme":
      return arg === "dark" || arg === "light"
        ? {
            text: `Theme set to ${arg}.`,
            action: { type: "theme", value: arg },
          }
        : usage("theme dark|light");
    case "open": {
      const scene = scenes.find((s) => s.id === arg);
      return scene
        ? {
            text: `Travelling to ${scene.label}.`,
            action: { type: "open", scene: scene.id },
          }
        : usage(`open <${scenes.map((s) => s.id).join(" | ")}>`);
    }
    case "history":
      return {
        text:
          context.history
            .map((entry, i) => `${String(i + 1).padStart(3)}  ${entry}`)
            .join("\n") || "No commands yet.",
      };
    case "clear":
      return { text: "", action: { type: "clear" } };
    case "exit":
      return {
        text: "Session ready when you return.",
        action: { type: "exit" },
      };
    default:
      return {
        text: `${rawCommand}: command not found.\nType help to see the available commands.`,
        error: true,
      };
  }
}
