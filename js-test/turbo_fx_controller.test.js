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
});
