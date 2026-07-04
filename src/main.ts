import "./style.css";
import { Game } from "./game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const scoreEl = document.querySelector<HTMLElement>("#score");
const coinsEl = document.querySelector<HTMLElement>("#coins");
const charmsEl = document.querySelector<HTMLElement>("#charms");
const multiplierEl = document.querySelector<HTMLElement>("#multiplier");
const overlayEl = document.querySelector<HTMLElement>("#overlay");

if (!canvas || !scoreEl || !coinsEl || !charmsEl || !multiplierEl || !overlayEl) {
  throw new Error("Missing required DOM elements");
}

const game = new Game(canvas, {
  score: scoreEl,
  coins: coinsEl,
  charms: charmsEl,
  multiplier: multiplierEl,
  overlay: overlayEl,
});
game.start();
