import { motion } from "framer-motion";
import { CATEGORIES, countOf } from "../data/work.js";

/* Glass pill bar. The cream highlight glides between categories. */
export default function CategoryBar({ value, onChange, id, className = "" }) {
  return (
    <div className={`cats glass ${className}`} role="tablist" aria-label="Work categories">
      {CATEGORIES.map((c) => {
        const on = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? "on" : ""}
            onClick={() => onChange(c.slug)}
          >
            {on && <motion.span layoutId={`cat-pill-${id}`} className="cats-pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span>{c.name}</span>
            <sup>{countOf(c.slug)}</sup>
          </button>
        );
      })}
    </div>
  );
}
