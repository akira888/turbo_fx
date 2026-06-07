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
});
