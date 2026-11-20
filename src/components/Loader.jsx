import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "./Motion.jsx";
import { PROFILE } from "../data/site.js";

/* Short intro: the name rises letter by letter while the first
   header frame and the fonts load, then the curtain lifts. */
export default function Loader({ firstImage, onReady, onGone }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const img = new Image();
    const done = () => { loaded.current = true; };
    img.onload = img.onerror = done;
    if (firstImage) img.src = firstImage; else done();
    document.fonts?.ready?.then(() => {});
    const cap = setTimeout(done, 3200);

    let raf, v = 0;
    const tick = () => {
      const t = performance.now() - t0;
      const target = loaded.current && t > 1100 ? 100 : Math.min(88, (t / 1600) * 88);
      v += (target - v) * 0.09;
      if (target === 100 && v > 99.4) v = 100;
      setPct(Math.round(v));
      if (v < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(cap); };
  }, [firstImage]);

  useEffect(() => {
    if (pct < 100 || leaving) return;
    const a = setTimeout(() => { setLeaving(true); onReady(); }, 180);
    return () => clearTimeout(a);
  }, [pct, leaving, onReady]);

  useEffect(() => {
    if (!leaving) return;
    const b = setTimeout(onGone, 1100);
    return () => clearTimeout(b);
  }, [leaving, onGone]);

  const letters = PROFILE.name.split("");
  return (
    <div className={`loader ${leaving ? "leaving" : ""}`} aria-hidden="true">
      <div className="loader-name display">
        {letters.map((ch, i) => (
          <span className="loader-mask" key={i}>
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.05 + i * 0.035 }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          </span>
        ))}
      </div>
      <motion.p className="loader-sub mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Portfolio <i>— selected work</i>
      </motion.p>
      <div className="loader-pct">{String(pct).padStart(3, "0")}</div>
      <div className="loader-bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
    </div>
  );
}
