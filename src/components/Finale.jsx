import { useRef } from "react";
import { Lines, Magnetic, Reveal } from "./Motion.jsx";
import { Stars } from "./Reviews.jsx";
import { PROFILE } from "../data/site.js";
import { scrollToId } from "../ready.js";

export default function Finale() {
  const name = useRef(null);
  const glow = (e) => {
    const el = name.current;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--glow", 1);
  };
  const off = () => name.current?.style.setProperty("--glow", 0);

  return (
    <section id="hire" className="finale" onMouseMove={glow} onMouseLeave={off}>
      <div className="wrap finale-body">
        <Reveal><p className="eyebrow mono"><i className="dot live" />Your project, next</p></Reveal>
        <Lines className="display finale-title" lines={["Like what", <>you <em>see?</em></>]} />

        <Reveal delay={0.1} className="hire glass">
          <div className="hire-rate">
            <span className="mono">Hourly rate</span>
            <b>${PROFILE.rate}<small>/hr</small></b>
          </div>
          <ul className="hire-facts">
            <li><Stars /> <span><b>{PROFILE.rating}</b> rating on Upwork</span></li>
            <li><i className="tick">✓</i> <span><b>{PROFILE.badge}</b> freelancer</span></li>
            <li><i className="tick">✓</i> <span>Anamorphic · FOOH · CGI · Product</span></li>
          </ul>
          <Magnetic strength={0.4} className="hire-orb-wrap">
            <a className="hire-orb" href={PROFILE.upwork} target="_blank" rel="noopener noreferrer" data-cursor="Hire">
              <span>Hire me<br />on Upwork</span>
              <i aria-hidden="true">↗</i>
            </a>
          </Magnetic>
        </Reveal>
      </div>

      <div className="finale-name" ref={name} aria-hidden="true">
        <span>{PROFILE.first}</span><span>{PROFILE.last}</span>
      </div>

      <footer className="foot wrap">
        <span className="mono">© {new Date().getFullYear()} {PROFILE.name}</span>
        <span className="mono">3D Animation Portfolio</span>
        <button type="button" className="mono foot-top" onClick={() => scrollToId("top")}>Back to top ↑</button>
      </footer>
    </section>
  );
}
