import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CategoryBar from "./CategoryBar.jsx";
import { Reveal, EASE } from "./Motion.jsx";
import { usePlayer } from "./Player.jsx";
import { byCategory, catName, fmtDuration } from "../data/work.js";

/* Hover-to-play preview. Pauses where it is when the pointer leaves.
   On touch screens it plays while the piece sits in the middle of the screen. */
function usePreview(item) {
  const root = useRef(null);
  const video = useRef(null);
  const want = useRef(false);
  const [armed, setArmed] = useState(false);
  const [live, setLive] = useState(false);
  const isVideo = item.type === "video";

  const play = () => {
    if (!isVideo) return;
    want.current = true;
    if (!armed) setArmed(true); else video.current?.play().catch(() => {});
  };
  const pause = () => { want.current = false; video.current?.pause(); };

  useEffect(() => { if (armed && want.current) video.current?.play().catch(() => {}); }, [armed]);
  useEffect(() => {
    if (!isVideo) return;
    const touch = window.matchMedia("(hover: none)").matches;
    const io = new IntersectionObserver(([e]) => {
      if (touch) (e.intersectionRatio >= 0.6 ? play : pause)();
      else if (!e.isIntersecting) pause();
    }, { threshold: [0, 0.6] });
    io.observe(root.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, armed]);

  const media = (
    <>
      <img src={item.poster} alt="" loading="lazy" decoding="async" draggable="false" />
      {armed && <video ref={video} className={live ? "on" : ""} src={item.preview} muted loop playsInline preload="auto" onPlaying={() => setLive(true)} />}
    </>
  );
  return { root, play, pause, media, isVideo };
}

/* Pointer-driven 3D lean + a moving glare + the picture drifting the other way,
   so every piece reads like a window with depth behind it. */
function useDepth(ref) {
  const fine = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onMove = (e) => {
    if (!fine) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`);
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    ["--ry", "--rx"].forEach((k) => el.style.setProperty(k, "0deg"));
    ["--px", "--py"].forEach((k) => el.style.setProperty(k, "0"));
  };
  return { onMove, onLeave };
}

function Tile({ item, list }) {
  const { open } = usePlayer();
  const { root, play, pause, media, isVideo } = usePreview(item);
  const depth = useDepth(root);
  return (
    <button
      ref={root}
      type="button"
      className={`tile ${item.category === "anamorphic" ? "tile-ana" : ""}`}
      data-cursor={isVideo ? "Play" : "View"}
      onMouseEnter={play}
      onMouseMove={depth.onMove}
      onMouseLeave={() => { pause(); depth.onLeave(); }}
      onFocus={play}
      onBlur={pause}
      onClick={() => open(item, list)}
      aria-label={`${item.title}, ${catName(item.category)}. Open`}
    >
      <span className="tile-media">{media}</span>
      <span className="tile-glare" aria-hidden="true" />
      <span className="tile-meta">
        <span className="tile-title">{item.title}</span>
        <span className="tile-sub mono">{item.client ? `${item.client} · ` : ""}{catName(item.category)}</span>
      </span>
      {isVideo && item.duration ? <span className="tile-dur mono">{fmtDuration(item.duration)}</span> : null}
    </button>
  );
}

function PhoneTile({ item, list }) {
  const { open } = usePlayer();
  const { root, play, pause, media } = usePreview(item);
  const depth = useDepth(root);
  return (
    <button
      ref={root}
      type="button"
      className="tile tile-phone"
      data-cursor="Play"
      onMouseEnter={play}
      onMouseMove={depth.onMove}
      onMouseLeave={() => { pause(); depth.onLeave(); }}
      onFocus={play}
      onBlur={pause}
      onClick={() => open(item, list)}
      aria-label={`${item.title}, ${catName(item.category)}. Open`}
    >
      <span className="phone-glass">
        <span className="tile-media">{media}</span>
        <span className="tile-glare" aria-hidden="true" />
        <span className="tile-meta">
          <span className="tile-title">{item.title}</span>
          <span className="tile-sub mono">{item.client ? `${item.client} · ` : ""}{catName(item.category)}</span>
        </span>
        {item.duration ? <span className="tile-dur mono">{fmtDuration(item.duration)}</span> : null}
      </span>
    </button>
  );
}

export default function Work({ category, onCategory }) {
  const items = byCategory(category);
  const label = category === "all" ? "All" : catName(category);

  return (
    <section id="work" className="work">
      <div className="wrap work-head">
        <Reveal>
          <p className="eyebrow mono"><i className="dot" />Selected work · {String(items.length).padStart(2, "0")} pieces</p>
        </Reveal>
        <h2 className="display work-title">
          <span className="line">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={label}
                className="line-in"
                initial={{ y: "105%", rotate: 2 }}
                animate={{ y: "0%", rotate: 0 }}
                exit={{ y: "-105%", rotate: -2 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                {label} <em>work.</em>
              </motion.span>
            </AnimatePresence>
          </span>
        </h2>
      </div>

      <div className="cats-sticky">
        <CategoryBar id="work" value={category} onChange={onCategory} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={category}
          className="wrap grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 16, filter: "blur(6px)", transition: { duration: 0.28 } }}
          transition={{ duration: 0.3 }}
        >
          {items.map((it, k) => {
            const phone = it.type === "video" && it.orientation === "portrait";
            const ar = phone ? 0.58 : it.w / it.h;
            return (
              <motion.div
                key={it.id}
                className="cell"
                style={{ "--ar": ar }}
                initial={{ opacity: 0, y: 46, scale: 0.94, rotateX: 8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "0px 0px -6% 0px" }}
                transition={{ duration: 0.8, ease: EASE, delay: (k % 5) * 0.06 }}
              >
                {phone ? <PhoneTile item={it} list={items} /> : <Tile item={it} list={items} />}
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
