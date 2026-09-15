"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { profile, scenes, type SceneId } from "@/data/profile";
import { terminalProfile } from "@/data/terminal";
import { completeCommand, executeCommand } from "@/lib/terminal";
import type { WorldRuntime } from "@/experience/runtime";
import { setTheme, useTheme } from "@/hooks/use-theme";

interface Entry {
  id: number;
  input: string;
  text: string;
  error?: boolean;
  download?: boolean;
}
export default function Terminal({
  open,
  onClose,
  navigate,
  runtime,
}: {
  open: boolean;
  onClose: () => void;
  navigate: (scene: SceneId) => void;
  runtime: WorldRuntime;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const sequence = useRef(0);
  const downloadRequest = useRef<AbortController | null>(null);
  const started = useRef(0);
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyPosition, setHistoryPosition] = useState<number | null>(null);
  const draft = useRef("");
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const theme = useTheme();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    let frame = 0;
    if (open) {
      started.current ||= performance.timeOrigin;
      returnFocus.current = document.activeElement as HTMLElement;
      if (!element.open) element.showModal();
      frame = requestAnimationFrame(() =>
        input.current?.focus({ preventScroll: true }),
      );
    } else if (element.open) {
      downloadRequest.current?.abort();
      element.close();
      if (returnFocus.current?.isConnected)
        returnFocus.current.focus({ preventScroll: true });
    }
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => {
      dialog.current?.style.setProperty(
        "--terminal-vh",
        `${viewport?.height ?? innerHeight}px`,
      );
      dialog.current?.style.setProperty(
        "--terminal-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      downloadRequest.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (open && output.current)
      output.current.scrollTop = output.current.scrollHeight;
  }, [entries, open]);

  async function download(id: number) {
    const controller = new AbortController();
    downloadRequest.current = controller;
    setPending(true);
    try {
      const response = await fetch(terminalProfile.cvUrl, {
        signal: controller.signal,
        cache: "no-cache",
      });
      if (!response.ok)
        throw new Error(
          "CV download is temporarily unavailable. Please try again.",
        );
      const bytes = await response.arrayBuffer();
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
        throw new Error(
          "The CV document could not be loaded. Please try again.",
        );
      const url = URL.createObjectURL(
        new Blob([bytes], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = terminalProfile.cvFilename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      const text = `${terminalProfile.cvFilename}\n${(bytes.byteLength / 1024).toFixed(0)} KB · PDF ready. Download requested.`;
      setEntries((items) =>
        items.map((item) =>
          item.id === id ? { ...item, text, download: true } : item,
        ),
      );
      setAnnouncement("CV PDF ready. Download requested.");
    } catch (error) {
      const text = controller.signal.aborted
        ? "Download cancelled."
        : error instanceof Error
          ? error.message
          : "CV download failed. Please try again.";
      setEntries((items) =>
        items.map((item) =>
          item.id === id ? { ...item, text, error: true } : item,
        ),
      );
      setAnnouncement(text);
    } finally {
      downloadRequest.current = null;
      setPending(false);
    }
  }
  function run(command: string) {
    const text = command.trim().slice(0, 256);
    if (!text || pending) return;
    const nextHistory = [...history, text].slice(-80);
    setHistory(nextHistory);
    setHistoryPosition(null);
    setValue("");
    draft.current = "";
    const result = executeCommand(text, {
      now: new Date(),
      sessionStartedAt: started.current,
      theme,
      scene: scenes[runtime.scene].id,
      history: nextHistory,
      graphics: runtime.stats.mode,
      fps: runtime.stats.fps,
      paused: runtime.paused || runtime.reducedMotion,
    });
    if (result.action?.type === "clear") {
      setEntries([]);
      setAnnouncement("Terminal cleared.");
    } else {
      const id = ++sequence.current;
      setEntries((items) =>
        [
          ...items,
          { id, input: text, text: result.text, error: result.error },
        ].slice(-40),
      );
      setAnnouncement(`${text}: ${result.text.slice(0, 350)}`);
      if (result.action?.type === "download") void download(id);
    }
    if (result.action?.type === "theme") setTheme(result.action.value);
    if (result.action?.type === "open") {
      onClose();
      navigate(result.action.scene);
    }
    if (result.action?.type === "exit") onClose();
    input.current?.focus({ preventScroll: true });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    run(value);
  }
  function keydown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (!history.length) return;
      if (historyPosition === null) draft.current = value;
      const position =
        event.key === "ArrowUp"
          ? Math.max(0, (historyPosition ?? history.length) - 1)
          : Math.min(history.length, (historyPosition ?? history.length) + 1);
      setHistoryPosition(position === history.length ? null : position);
      setValue(position === history.length ? draft.current : history[position]);
    } else if (event.key === "Tab" && !event.shiftKey) {
      const matches = completeCommand(value);
      if (
        matches.length === 1 &&
        matches[0].toLowerCase() !== value.toLowerCase()
      ) {
        event.preventDefault();
        setValue(matches[0]);
      }
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setEntries([]);
      setAnnouncement("Terminal cleared.");
    } else if (
      event.ctrlKey &&
      event.key.toLowerCase() === "c" &&
      event.currentTarget.selectionStart === event.currentTarget.selectionEnd &&
      !window.getSelection()?.toString()
    ) {
      event.preventDefault();
      downloadRequest.current?.abort();
      setValue("");
      setHistoryPosition(null);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="terminal-dialog"
      data-theme={theme}
      aria-labelledby="terminal-title"
      aria-describedby="terminal-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <div className="terminal-frame">
        <header className="terminal-titlebar">
          <div className="terminal-heading">
            <span className="terminal-mark" aria-hidden="true">
              &gt;_
            </span>
            <div>
              <h2 id="terminal-title">Portfolio terminal</h2>
              <p>
                samet@portfolio <span>/</span> ~
              </p>
            </div>
          </div>
          <button
            className="terminal-close"
            onClick={onClose}
            aria-label="Close terminal"
          >
            ×
          </button>
        </header>
        <div
          ref={output}
          className="terminal-output"
          role="region"
          aria-label="Terminal output"
          tabIndex={0}
          data-scroll-panel
        >
          <div className="terminal-welcome">
            <span className="terminal-eyebrow">
              SYSTEM ENGINEER / INTERACTIVE PROFILE
            </span>
            <p className="terminal-name">
              {profile.fullName}
              <span>_</span>
            </p>
            <p id="terminal-description">
              Explore my work, one command at a time.
            </p>
            <p>
              Start with <code>help</code>, or try a command below.
            </p>
            <div
              className="terminal-suggestions"
              aria-label="Suggested commands"
            >
              {["whoami", "uptime", "skills linux", "curl CV"].map(
                (command) => (
                  <button
                    key={command}
                    disabled={pending}
                    onClick={() => run(command)}
                  >
                    {command}
                    <span aria-hidden="true">↵</span>
                  </button>
                ),
              )}
            </div>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`terminal-entry ${entry.error ? "is-error" : ""}`}
            >
              <p className="terminal-echo">
                <span aria-hidden="true">samet:~$</span>{" "}
                <code>{entry.input}</code>
              </p>
              <pre>{entry.text}</pre>
              {entry.download && (
                <a
                  className="terminal-download"
                  href={terminalProfile.cvUrl}
                  download={terminalProfile.cvFilename}
                >
                  Download PDF again ↗
                </a>
              )}
            </div>
          ))}
        </div>
        <form
          className="terminal-commandline"
          onSubmit={submit}
          aria-busy={pending}
        >
          <span className="terminal-prompt" aria-hidden="true">
            samet:~$
          </span>
          <label className="sr-only" htmlFor="terminal-command">
            Command
          </label>
          <input
            ref={input}
            id="terminal-command"
            value={value}
            maxLength={256}
            readOnly={pending}
            onChange={(event) => {
              setValue(event.target.value);
              setHistoryPosition(null);
            }}
            onKeyDown={keydown}
            placeholder={pending ? "Downloading CV…" : "Type a command…"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
          />
          <button
            type="submit"
            disabled={pending || !value.trim()}
            aria-label="Run command"
          >
            ↵
          </button>
        </form>
        <footer className="terminal-footnote">
          <span>
            <i /> Portfolio shell
          </span>
          <span>
            ↑↓ history <b>·</b> Tab complete <b>·</b> Esc close
          </span>
        </footer>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </p>
      </div>
    </dialog>
  );
}
