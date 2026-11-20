import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CategoryBar from "./CategoryBar.jsx";
import { Lines, Magnetic, EASE } from "./Motion.jsx";
import { usePlayer } from "./Player.jsx";
import { useReady, scrollToId } from "../ready.js";
import { stageFor, catName, fmtDuration } from "../data/work.js";

const SLIDE_MS = 8000;
const PHONE_MS = 9500;
const pad = (n) => String(n).padStart(2, "0");

/* The whole stage leans toward the mouse, wherever it is on the page.
   Smoothed every frame so it feels heavy, like a real screen on a rig. */
function useTilt(ref, { x = 13, y = 7, baseX = 4, baseY = -6 } = {}) {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const move = (e) => {
      tx = Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, (e.clientY / innerHeight - 0.5) * 2));
    };
    const tick = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      if (ref.current) {
        ref.current.style.transform = `rotateX(${(-cy * y + baseX).toFixed(2)}deg) rotateY(${(cx * x + baseY).toFixed(2)}deg)`;
        ref.current.style.setProperty("--gx", `${(50 + cx * 30).toFixed(1)}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", move, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, [ref, x, y, baseX, baseY]);
}

/* ---------- landscape LED screen ---------- */
function Screen({ item, playing, onOpen }) {
  const video = useRef(null);
  const [live, setLive] = useState(false);
  useEffect(() => { setLive(false); }, [item.id]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => {}); else v.pause();
  }, [playing, item.id]);

  return (
    <div className="screen-rig" style={{ "--ar": item.w / item.h }}>
      <button type="button" className="screen" onClick={onOpen} data-cursor="Play" aria-label={`Play ${item.title}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={item.id}
            className="screen-media"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <img src={item.type === "image" ? item.full : item.poster} alt="" />
            {item.type === "video" && (
              <video
                ref={video}
                className={live ? "on" : ""}
                src={`${item.full}#t=${item.start || 0}`}
                muted loop playsInline autoPlay={playing} preload="auto"
                onPlaying={() => setLive(true)}
              />
            )}
          </motion.span>
        </AnimatePresence>
        <i className="screen-led" aria-hidden="true" />
        <i className="screen-glare" aria-hidden="true" />
      </button>
      <div className="screen-reflect" aria-hidden="true" style={{ backgroundImage: `url("${item.poster}")` }} />
    </div>
  );
}

/* ---------- FOOH: three phones, like a feed ---------- */
function HeroPhone({ item, slot, playing, onOpen }) {
  const video = useRef(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => {}); else v.pause();
  }, [playing]);
  return (
    <motion.button
      type="button"
      className={`hphone hp${slot}`}
      onClick={onOpen}
      data-cursor="Play"
      aria-label={`Play ${item.title}`}
      initial={{ opacity: 0, rotateY: 75, y: 40 }}
      animate={{ opacity: 1, rotateY: 0, y: 0 }}
      exit={{ opacity: 0, rotateY: -75, y: -20 }}
      transition={{ duration: 0.9, ease: EASE, delay: slot * 0.12 }}
    >
      <span className="hphone-screen">
        <img src={item.poster} alt="" />
        <video ref={video} className={live ? "on" : ""} src={item.preview} muted loop playsInline autoPlay={playing} preload="auto" onPlaying={() => setLive(true)} />
        <span className="hphone-shine" aria-hidden="true" />
      </span>
      {item.duration ? <span className="hphone-time mono">{fmtDuration(item.duration)}</span> : null}
    </motion.button>
  );
}

function Phones({ items, page, playing, onOpen }) {
  const n = items.length;
  const start = (page * 3) % n;
  const trio = [0, 1, 2].map((k) => items[(start + k) % n]).filter(Boolean);
  return (
    <div className="phones">
      {trio.map((it, k) => (
        <div className={`phone-slot ps${k}`} key={k}>
          <AnimatePresence mode="wait">
            <HeroPhone key={it.id} item={it} slot={k} playing={playing} onOpen={() => onOpen(it)} />
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ HERO ------------------------------ */
export default function Hero({ category, onCategory }) {
  const ready = useReady();
  const { open } = usePlayer();
  const hero = useRef(null);
  const rig = useRef(null);
  const [i, setI] = useState(0);
  const [inView, setInView] = useState(true);
  const { mode, items } = useMemo(() => stageFor(category), [category]);
  const n = items.length;
  const idx = n ? i % n : 0;
  const ms = mode === "phones" ? PHONE_MS : SLIDE_MS;

  // the "current" piece: the screen item, or the middle phone
  const current = mode === "phones" ? items[((idx * 3) % n + 1) % n] : items[idx];

  useTilt(rig);
  useEffect(() => { setI(0); }, [category]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.12 });
    io.observe(hero.current);
    const vis = () => setInView(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  const running = ready && inView && n > 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setI((v) => v + 1), ms);
    return () => clearTimeout(t);
  }, [i, running, ms, category]);

  const step = (d) => setI((v) => (v + d + n * 10) % n);
  const playing = ready && inView;

  const show = (delay) => ({
    initial: { opacity: 0, y: 22 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, ease: EASE, delay },
  });

  return (
    <section className="hero" ref={hero} id="top">
      {/* the current piece's colour spills over the whole header */}
      <div className="hero-amb" aria-hidden="true">
        <AnimatePresence>
          {current && (
            <motion.img
              key={current.id}
              src={current.poster}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6 }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="hero-floor" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-head wrap">
        <motion.p className="eyebrow mono" {...show(0.1)}>
          <i className="dot live" />3D Animation · Anamorphic · FOOH · CGI
        </motion.p>
        <Lines
          as="h1"
          onLoad
          delay={0.15}
          className="display hero-title"
          lines={[<>Daniyal Murtaza <em>Portfolio.</em></>]}
        />
        <motion.div className="hero-cats" {...show(0.45)}>
          <CategoryBar id="hero" value={category} onChange={onCategory} />
        </motion.div>
      </div>

      <motion.div
        className="stage"
        initial={{ opacity: 0, scale: 0.92, y: 50 }}
        animate={ready ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={{ duration: 1.3, ease: EASE, delay: 0.35 }}
      >
        <div className="stage-3d">
          <div className="stage-rig" ref={rig}>
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                className="stage-scene"
                initial={{ opacity: 0, rotateY: -28, scale: 0.86, filter: "blur(14px)" }}
                animate={{ opacity: 1, rotateY: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, rotateY: 28, scale: 0.9, filter: "blur(14px)" }}
                transition={{ duration: 0.75, ease: EASE }}
              >
                {n > 0 && (mode === "phones"
                  ? <Phones items={items} page={idx} playing={playing} onOpen={(it) => open(it, items)} />
                  : <Screen item={items[idx]} playing={playing} onOpen={() => open(items[idx], items)} />)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="stage-foot wrap">
          <div className="stage-meta">
            <p className="stage-tag mono">
              <i className="dot live" />
              {mode === "phones" ? "On the street" : "On screen"} ·{" "}
              <AnimatePresence mode="wait">
                <motion.span key={current?.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                  {current?.title}
                </motion.span>
              </AnimatePresence>
            </p>
            <span className="mono stage-count">{pad(idx + 1)} <i>/</i> {pad(n)}</span>
            <span className="stage-prog" aria-hidden="true">
              <span key={`${category}-${i}`} style={{ animationDuration: `${ms}ms`, animationPlayState: running ? "running" : "paused" }} />
            </span>
            <span className="mono stage-cat">{catName(category)}{current?.client ? ` · ${current.client}` : ""}</span>
          </div>

          <Magnetic strength={0.35}>
            <button type="button" className="btn btn-cream btn-more" onClick={() => scrollToId("work")}>
              See more work <span aria-hidden="true">↓</span>
            </button>
          </Magnetic>

          <div className="stage-nav">
            <button type="button" className="round" onClick={() => step(-1)} aria-label="Previous piece">←</button>
            <button type="button" className="round" onClick={() => step(1)} aria-label="Next piece">→</button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
