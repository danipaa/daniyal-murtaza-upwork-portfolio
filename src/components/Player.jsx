import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WORK, catName } from "../data/work.js";

const Ctx = createContext({ open: () => {} });
export const usePlayer = () => useContext(Ctx);

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export function PlayerProvider({ children }) {
  const [state, setState] = useState(null); // { list, index }
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const video = useRef(null);
  const shell = useRef(null);

  const item = state ? state.list[state.index] : null;

  const open = useCallback((it, list) => {
    const l = list && list.length ? list : WORK;
    setState({ list: l, index: Math.max(0, l.findIndex((x) => x.id === it.id)) });
    setPlaying(true); setTime(0); setDur(0);
  }, []);
  const close = useCallback(() => setState(null), []);
  const step = useCallback((d) => {
    setState((s) => (s ? { ...s, index: (s.index + d + s.list.length) % s.list.length } : s));
    setPlaying(true); setTime(0); setDur(0);
  }, []);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  }, []);

  useEffect(() => {
    if (!state) return;
    window.__lenis?.stop();
    document.documentElement.classList.add("locked");
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === " ") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
      document.documentElement.classList.remove("locked");
    };
  }, [state, close, step, toggle]);

  const seek = (e) => {
    const v = video.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * v.duration;
  };
  const fullscreen = () => {
    const v = video.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (shell.current?.requestFullscreen) shell.current.requestFullscreen();
    else v?.webkitEnterFullscreen?.();
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {item && (
          <motion.div
            className="player"
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="player-backdrop" onClick={close} style={{ backgroundImage: `url("${item.poster}")` }} />
            <div className="player-top">
              <div>
                <div className="player-title">{item.title}</div>
                <div className="mono player-sub">{item.client ? `${item.client} · ` : ""}{catName(item.category)}</div>
              </div>
              <div className="player-top-right">
                <span className="mono player-count">{String(state.index + 1).padStart(2, "0")} / {String(state.list.length).padStart(2, "0")}</span>
                <button className="glass-btn" onClick={close} aria-label="Close">Close <span aria-hidden="true">✕</span></button>
              </div>
            </div>

            <button className="player-nav prev" onClick={() => step(-1)} aria-label="Previous">←</button>
            <button className="player-nav next" onClick={() => step(1)} aria-label="Next">→</button>

            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                ref={shell}
                className="player-stage"
                style={{ "--ar": item.w / item.h }}
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.type === "video" ? (
                  <video
                    ref={video}
                    src={item.full}
                    poster={item.poster}
                    autoPlay
                    loop
                    playsInline
                    muted={muted}
                    onClick={toggle}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
                    onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                  />
                ) : (
                  <img src={item.full} alt={item.title} />
                )}
              </motion.div>
            </AnimatePresence>

            {item.type === "video" && (
              <div className="player-bar">
                <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? "Pause" : "Play"}</button>
                <span className="mono">{fmt(time)}</span>
                <div className="player-track" onClick={seek} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(time)} tabIndex={0}>
                  <span style={{ transform: `scaleX(${dur ? time / dur : 0})` }} />
                </div>
                <span className="mono">{fmt(dur)}</span>
                <button onClick={() => setMuted((m) => !m)}>{muted ? "Sound off" : "Sound on"}</button>
                <button onClick={fullscreen}>Fullscreen</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
