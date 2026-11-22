/** Mutable state shared between the DOM scroll timeline and the WebGL render loop (no React re-renders). */
export const heroState = {
  /** 0 → 1 across the pinned hero */
  progress: 0,
  /** 0 → 1 as the hero scrolls away after the pin */
  exit: 0,
  pointerX: 0,
  pointerY: 0,
};
