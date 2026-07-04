export type ActionHandler = (action: "left" | "right" | "jump" | "slide") => void;

const KEY_MAP: Record<string, "left" | "right" | "jump" | "slide"> = {
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
