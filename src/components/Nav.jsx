import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReady, scrollToId } from "../ready.js";
import { PROFILE } from "../data/site.js";
import { EASE } from "./Motion.jsx";

const LINKS = [
  ["work", "Work"],
  ["reviews", "Reviews"],
  ["hire", "Hire"],
];

export default function Nav() {
  const ready = useReady();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let last = scrollY;
    const on = () => {
      const y = scrollY;
      setScrolled(y > 30);
      setHidden(y > 500 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <motion.header
      className={`nav ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`}
      initial={{ y: -90, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 1, ease: EASE, delay: 0.1 }}
    >
      <div className="nav-left">
      <button type="button" className="nav-id" onClick={() => scrollToId("top")} aria-label="Back to top">
        <img className="nav-mono" src="/favicon.svg" alt="" width="46" height="46" />
        <span className="nav-name">{PROFILE.name}</span>
      </button>
      <span className="nav-tag" title="This portfolio is shared for Upwork clients">
        <i aria-hidden="true" />
        <span className="nav-tag-long">Upwork Portfolio</span>
        <span className="nav-tag-short">Upwork</span>
      </span>
      </div>

      <nav className="nav-links" onMouseLeave={() => setHover(null)}>
        {LINKS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => scrollToId(id)} onMouseEnter={() => setHover(id)}>
            {hover === id && <motion.span layoutId="nav-hover" className="nav-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-right">
        <span className="nav-badge mono"><b>★ {PROFILE.rating}</b> · {PROFILE.badge}</span>
        <a className="btn btn-cream nav-cta" href={PROFILE.upwork} target="_blank" rel="noopener noreferrer">
          Hire on Upwork <span aria-hidden="true">↗</span>
        </a>
      </div>
    </motion.header>
  );
}
