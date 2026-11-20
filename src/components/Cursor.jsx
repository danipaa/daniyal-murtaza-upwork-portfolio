import { useEffect, useRef, useState } from "react";

/* Minimal cursor: a small dot that follows the pointer with a slight trail.
   - over links/buttons it opens into a thin ring
   - over anything with data-cursor="Play" (etc.) it becomes a labelled pill
   Only on devices with a real mouse; touch devices keep native behaviour. */
export default function Cursor() {
  const el = useRef(null);
  const [mode, setMode] = useState("dot");
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf, shown = false;
    const node = () => el.current;

    const move = (e) => {
      x = e.clientX; y = e.clientY;
      if (!shown && node()) { shown = true; cx = x; cy = y; node().style.opacity = 1; }
    };
    const over = (e) => {
      const t = e.target.closest?.("[data-cursor]");
      if (t) { setMode("label"); setLabel(t.dataset.cursor); return; }
      if (e.target.closest?.("a, button, [role=button], input, textarea, select, label")) { setMode("ring"); return; }
      setMode("dot");
    };
    const leave = () => { if (node()) node().style.opacity = 0; shown = false; };
    const down = () => node()?.classList.add("down");
    const up = () => node()?.classList.remove("down");

    const tick = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      if (node()) node().style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <div ref={el} className={`cursor is-${mode}`} aria-hidden="true">
      <span className="cursor-shape"><span className="cursor-label">{label}</span></span>
    </div>
  );
}
