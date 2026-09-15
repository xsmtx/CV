import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="scene-kicker">OUTSIDE THE KNOWN SPACE</p>
      <h1>Lost in orbit.</h1>
      <p>This location doesn’t exist. Your way back does.</p>
      <Link href="/">RETURN TO ORIGIN ↗</Link>
    </main>
  );
}
