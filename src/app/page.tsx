import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-header"><span>TRD / EXPERIMENT 001</span><span>TWO CHAMBERS · ONE TIMELINE</span></header>
      <section className="landing-content">
        <p className="eyebrow">TEMPORAL SESSION DETECTED</p>
        <h1>ECHO<span>{"//"}</span>SHIFT</h1>
        <p className="tagline">SAME MOVES.<br />A DIFFERENT TOMORROW.</p>
        <p className="session-note">This timeline exists only while this window remains open.<br />Refreshing or closing it will collapse the timeline.</p>
        <Link className="primary-button" href="/game">ENTER THE LOOP <span aria-hidden="true">↗</span></Link>
        <p className="build-note">ONE LOCKED DOOR. ONE OF YOU.<br />UNTIL THE FIRST RESET.</p>
      </section>
      <footer className="landing-footer"><span>NO ACCOUNTS. NO SAVES. ONE SESSION. ONE TIMELINE.</span><span>KEYBOARD + MOUSE</span></footer>
    </main>
  );
}
