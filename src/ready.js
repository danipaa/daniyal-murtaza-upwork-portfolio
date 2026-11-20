import { createContext, useContext } from "react";

/* true once the intro loader has finished, so entrance animations wait for it */
export const ReadyCtx = createContext(false);
export const useReady = () => useContext(ReadyCtx);

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -10, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}
