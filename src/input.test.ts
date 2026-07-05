import { describe, expect, it } from "vitest";
import { swipeToAction } from "./input";

describe("swipeToAction", () => {
  it("treats a stationary touch as a tap, which defaults to jump", () => {
    expect(swipeToAction(0, 0)).toBe("jump");
    expect(swipeToAction(5, -5)).toBe("jump");
  });

  it("stays a tap right up to the swipe threshold, exclusive", () => {
    expect(swipeToAction(23, 0)).toBe("jump");
    expect(swipeToAction(0, 23)).toBe("jump");
  });

  it("treats the swipe threshold itself as a swipe, not a tap", () => {
    expect(swipeToAction(24, 0)).toBe("right");
    expect(swipeToAction(0, 24)).toBe("slide");
  });

  it("maps a horizontal swipe to a lane change", () => {
    expect(swipeToAction(100, 0)).toBe("right");
    expect(swipeToAction(-100, 0)).toBe("left");
  });

  it("maps a vertical swipe to jump (up) or slide (down)", () => {
    expect(swipeToAction(0, -100)).toBe("jump");
    expect(swipeToAction(0, 100)).toBe("slide");
  });

  it("picks the dominant axis on a diagonal swipe", () => {
    expect(swipeToAction(30, 100)).toBe("slide");
    expect(swipeToAction(100, 30)).toBe("right");
  });

  it("breaks an exact horizontal/vertical tie toward the horizontal action", () => {
    expect(swipeToAction(50, 50)).toBe("right");
    expect(swipeToAction(-50, -50)).toBe("left");
  });
});
