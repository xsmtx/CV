export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 8h12v12H8zM16 8V4H4v12h4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function PauseIcon({ paused }: { paused: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      {paused ? (
        <path d="m5 3 8 5-8 5V3Z" stroke="currentColor" />
      ) : (
        <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}
