import { Lines, Reveal } from "./Motion.jsx";
import { PROFILE, REVIEWS } from "../data/site.js";

export const Stars = ({ className = "" }) => (
  <span className={`stars ${className}`} aria-label="5 out of 5 stars">
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
    ))}
  </span>
);

function Card({ r, i }) {
  return (
    <article className="rcard glass" style={{ "--d": `${(i % 5) * -1.3}s`, "--t": `${6 + (i % 3)}s` }}>
      <div className="rcard-top">
        <Stars />
        <span className="mono rcard-score">{PROFILE.rating}</span>
      </div>
      <p className="rcard-text"><span className="rcard-q" aria-hidden="true">“</span>{r.text}</p>
      <div className="rcard-job">
        <b>{r.job}</b>
        <span className="mono">{r.date} · Upwork</span>
      </div>
      <ul className="rcard-tags">
        {r.tags.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </article>
  );
}

function Row({ items, speed, reverse }) {
  const set = (hidden) => (
    <div className="rrow-set" aria-hidden={hidden || undefined}>
      {items.map((r, i) => <Card key={i} r={r} i={i + (reverse ? 2 : 0)} />)}
    </div>
  );
  return (
    <div className={`rrow ${reverse ? "rev" : ""}`} style={{ "--speed": `${speed}s` }}>
      <div className="rrow-track">{set(false)}{set(true)}</div>
    </div>
  );
}

export default function Reviews() {
  const half = Math.ceil(REVIEWS.length / 2);
  const a = [...REVIEWS.slice(0, half), ...REVIEWS.slice(half)];
  const b = [...REVIEWS.slice(half), ...REVIEWS.slice(0, half)];
  return (
    <section id="reviews" className="reviews">
      <div className="wrap reviews-head">
        <div>
          <Reveal><p className="eyebrow mono"><i className="dot" />Client reviews from Upwork</p></Reveal>
          <Lines className="display display-sm" lines={["Don't take", <>my <em>word for it.</em></>]} />
        </div>
        <Reveal delay={0.15} className="score glass">
          <div className="score-n">{PROFILE.rating}</div>
          <div className="score-side">
            <Stars className="stars-lg" />
            <span className="mono">Average Upwork rating</span>
          </div>
          <div className="score-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1 3 1 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1L2.7 15.5l1-3-1-3 2.8-1.6.9-3.1 3.2.3z" /><path d="M8.5 12.2l2.4 2.3 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span><b>{PROFILE.badge}</b><span className="mono">on Upwork</span></span>
          </div>
        </Reveal>
      </div>

      <div className="rrows">
        <Row items={a} speed={70} />
        <Row items={b} speed={80} reverse />
      </div>
    </section>
  );
}
