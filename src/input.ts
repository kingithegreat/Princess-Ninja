export type Action = "left" | "right" | "jump" | "slide";
export type ActionHandler = (action: Action) => void;

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "jump",
  w: "jump",
  W: "jump",
  " ": "jump",
  ArrowDown: "slide",
  s: "slide",
  S: "slide",
};

/** Below this drag distance (in px) a touch/click counts as a tap rather
 * than a swipe — tap defaults to jump, the runner-genre norm. */
const SWIPE_THRESHOLD = 24;

export function swipeToAction(dx: number, dy: number): Action {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return "jump";
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? "jump" : "slide";
  return dx < 0 ? "left" : "right";
}

export function bindInput(handler: ActionHandler): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    const action = KEY_MAP[event.key];
    if (!action) return;
    event.preventDefault();
    handler(action);
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

/** Swipe/tap controls for touch and mouse, aimed at the mobile (Capacitor)
 * build where there's no keyboard: swipe up/down maps to jump/slide, left/
 * right to lane changes, and a stationary tap defaults to jump. */
export function bindPointerInput(target: HTMLElement, handler: ActionHandler): () => void {
  let tracking = false;
  let startX = 0;
  let startY = 0;

  const onPointerDown = (event: PointerEvent) => {
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!tracking) return;
    tracking = false;
    handler(swipeToAction(event.clientX - startX, event.clientY - startY));
  };

  const onPointerCancel = () => {
    tracking = false;
  };

  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("pointerup", onPointerUp);
  target.addEventListener("pointercancel", onPointerCancel);
  return () => {
    target.removeEventListener("pointerdown", onPointerDown);
    target.removeEventListener("pointerup", onPointerUp);
    target.removeEventListener("pointercancel", onPointerCancel);
  };
}
