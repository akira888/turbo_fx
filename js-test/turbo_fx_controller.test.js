import { describe, it, expect, beforeEach } from "vitest";
import { Application } from "@hotwired/stimulus";
import TurboFxController from "../app/assets/javascripts/turbo_fx/turbo_fx_controller.js";

// Stimulus アプリを起動し、root にコントローラを接続するヘルパー
function startStimulus(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register("turbo-fx", TurboFxController);
  return app;
}

// Stimulus の接続は次のマイクロタスクで起こるため待つ
function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("TurboFxController", () => {
  it("connects to an element with data-controller='turbo-fx'", async () => {
    const app = startStimulus(`<div data-controller="turbo-fx" id="root"></div>`);
    await nextTick();

    const root = document.getElementById("root");
    const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
    expect(controller).not.toBeNull();
  });

  it("adds the glitching class to the frame on turbo:frame-render", async () => {
    const app = startStimulus(`
      <div data-controller="turbo-fx" id="root">
        <turbo-frame id="a"></turbo-frame>
      </div>
    `);
    await nextTick();

    const frame = document.getElementById("a");
    frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

    expect(frame.classList.contains("turbo-fx--glitching")).toBe(true);
  });

  it("sets the --turbo-fx-duration CSS variable from the duration value", async () => {
    const app = startStimulus(`
      <div data-controller="turbo-fx" data-turbo-fx-duration-value="400" id="root">
        <turbo-frame id="a"></turbo-frame>
      </div>
    `);
    await nextTick();

    const frame = document.getElementById("a");
    frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

    expect(frame.style.getPropertyValue("--turbo-fx-duration")).toBe("400ms");
  });

  describe("off exclusion", () => {
    function controllerFor(html) {
      document.body.innerHTML = html;
      const app = Application.start();
      app.register("turbo-fx", TurboFxController);
      const root = document.getElementById("root");
      return { app, root };
    }

    it("does not apply when the target itself is data-turbo-fx='off'", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a" data-turbo-fx="off"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitching")).toBe(false);
    });

    it("does not apply when an ancestor is data-turbo-fx='off'", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <div data-turbo-fx="off">
            <turbo-frame id="a"></turbo-frame>
          </div>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitching")).toBe(false);
    });

    it("applies when the nearest data-turbo-fx is not off", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" data-turbo-fx="glitch" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitching")).toBe(true);
    });
  });

  describe("re-triggering on rapid updates", () => {
    it("keeps the class applied after a repeated frame-render", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitching")).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("removes the glitching class on animationend", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitching")).toBe(true);

      frame.dispatchEvent(new CustomEvent("animationend", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitching")).toBe(false);
    });
  });

  describe("stream action dispatch", () => {
    function controllerFor(html) {
      document.body.innerHTML = html;
      const app = Application.start();
      app.register("turbo-fx", TurboFxController);
      const root = document.getElementById("root");
      return { app, root };
    }

    it("applies glitching class for replace action", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <div id="target"></div>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const target = document.getElementById("target");

      controller.applyStreamEffect("replace", target, []);

      expect(target.classList.contains("turbo-fx--glitching")).toBe(true);
      expect(target.classList.contains("turbo-fx--appearing")).toBe(false);
    });

    it("applies appearing class to inserted elements for append action", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <div id="target"></div>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const target = document.getElementById("target");
      const inserted = document.createElement("li");
      target.appendChild(inserted);

      controller.applyStreamEffect("append", target, [inserted]);

      expect(inserted.classList.contains("turbo-fx--appearing")).toBe(true);
      expect(target.classList.contains("turbo-fx--glitching")).toBe(false);
    });

    it("does nothing for remove action", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <div id="target"></div>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const target = document.getElementById("target");

      controller.applyStreamEffect("remove", target, []);

      expect(target.classList.contains("turbo-fx--glitching")).toBe(false);
      expect(target.classList.contains("turbo-fx--appearing")).toBe(false);
    });
  });
});
