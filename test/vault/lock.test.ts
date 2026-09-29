import { describe, expect, it } from "vitest";

import { KeyedLock } from "../../src/vault/lock.js";

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("KeyedLock", () => {
  it("runs tasks with the same key one at a time, in order", async () => {
    const lock = new KeyedLock();
    const events: string[] = [];
    const task = (name: string, ms: number) =>
      lock.run("file", async () => {
        events.push(`start ${name}`);
        await tick(ms);
        events.push(`end ${name}`);
      });
    await Promise.all([task("a", 20), task("b", 1), task("c", 1)]);
    expect(events).toEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });

  it("runs different keys in parallel", async () => {
    const lock = new KeyedLock();
    const events: string[] = [];
    await Promise.all([
      lock.run("a", async () => {
        events.push("start a");
        await tick(20);
        events.push("end a");
      }),
      lock.run("b", async () => {
        events.push("start b");
        await tick(1);
        events.push("end b");
      }),
    ]);
    expect(events.indexOf("start b")).toBeLessThan(events.indexOf("end a"));
  });

  it("releases the key when a task fails", async () => {
    const lock = new KeyedLock();
    await expect(lock.run("k", () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(lock.run("k", () => Promise.resolve("next"))).resolves.toBe("next");
  });
});
