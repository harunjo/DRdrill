import { describe, expect, it } from "vitest";
import { rateLimitOk, type RateEntry } from "./ratelimit";

const store = () => new Map<string, RateEntry>();

describe("rateLimitOk", () => {
  it("allows up to the limit then blocks within the window", () => {
    const s = store();
    for (let i = 0; i < 3; i++) expect(rateLimitOk(s, "ip", 1000, 3, 60_000)).toBe(true);
    expect(rateLimitOk(s, "ip", 1000, 3, 60_000)).toBe(false); // 4th within window
  });

  it("resets once the window elapses", () => {
    const s = store();
    expect(rateLimitOk(s, "ip", 0, 1, 60_000)).toBe(true);
    expect(rateLimitOk(s, "ip", 0, 1, 60_000)).toBe(false);
    expect(rateLimitOk(s, "ip", 60_000, 1, 60_000)).toBe(true); // window passed
  });

  it("tracks IPs independently", () => {
    const s = store();
    expect(rateLimitOk(s, "a", 0, 1, 60_000)).toBe(true);
    expect(rateLimitOk(s, "b", 0, 1, 60_000)).toBe(true); // different IP unaffected
  });
});
