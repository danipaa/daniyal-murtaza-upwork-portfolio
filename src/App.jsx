import { useCallback, useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Lenis from "lenis";
import { ReadyCtx } from "./ready.js";
import Loader from "./components/Loader.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Work from "./components/Work.jsx";
import Reviews from "./components/Reviews.jsx";
import Finale from "./components/Finale.jsx";
import Cursor from "./components/Cursor.jsx";
import { PlayerProvider } from "./components/Player.jsx";
import { stageFor } from "./data/work.js";

const firstPoster = stageFor("all").items[0]?.poster;

export default function App() {
  const [ready, setReady] = useState(false);
  const [loader, setLoader] = useState(true);
  const [category, setCategory] = useState("all");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.__lenis = null; };
  }, []);

  useEffect(() => {
    if (loader) window.__lenis?.stop(); else window.__lenis?.start();
    document.documentElement.classList.toggle("locked", loader);
  }, [loader]);

  const onReady = useCallback(() => setReady(true), []);
  const onGone = useCallback(() => setLoader(false), []);

  return (
    <ReadyCtx.Provider value={ready}>
      <PlayerProvider>
        {loader && <Loader firstImage={firstPoster} onReady={onReady} onGone={onGone} />}
        <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
        <div className="bg-glow" aria-hidden="true" />
        <Nav />
        <main>
          <Hero category={category} onCategory={setCategory} />
          <Work category={category} onCategory={setCategory} />
          <Reviews />
          <Finale />
        </main>
        <div className="grain" aria-hidden="true" />
        <Cursor />
      </PlayerProvider>
    </ReadyCtx.Provider>
  );
}
