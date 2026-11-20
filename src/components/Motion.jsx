import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReady } from "../ready.js";

export const EASE = [0.22, 1, 0.36, 1];

/* Fade + rise when scrolled into view */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/* Headline lines that slide up from behind a mask.
   `lines` is an array of strings or JSX. `onLoad` waits for the loader instead of scroll. */
export function Lines({ lines, className, delay = 0, onLoad = false, as: Tag = "h2" }) {
  const ready = useReady();
  const anim = { y: "0%", rotate: 0 };
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span className="line" key={i}>
          <motion.span
            className="line-in"
            initial={{ y: "110%", rotate: 3 }}
            {...(onLoad ? { animate: ready ? anim : undefined } : { whileInView: anim, viewport: { once: true, margin: "0px 0px -10% 0px" } })}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.09 }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Element that leans toward the pointer */
export function Magnetic({ children, strength = 0.3, className }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.span ref={ref} className={`magnetic ${className || ""}`} style={{ x, y }} onMouseMove={move} onMouseLeave={reset}>
      {children}
    </motion.span>
  );
}

export function Marquee({ items, className = "", speed = 40, sep = "✦" }) {
  const row = (hidden) => (
    <div className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span className="marquee-item" key={i}>{t}<i className="marquee-sep">{sep}</i></span>
      ))}
    </div>
  );
  return (
    <div className={`marquee ${className}`} style={{ "--speed": `${speed}s` }}>
      {row(false)}{row(true)}
    </div>
  );
}
