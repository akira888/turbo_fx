import { describe, it, expect, beforeEach, vi } from "vitest";
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

  it("adds the glitch class to the frame on turbo:frame-render", async () => {
    const app = startStimulus(`
      <div data-controller="turbo-fx" id="root">
        <turbo-frame id="a"></turbo-frame>
      </div>
    `);
    await nextTick();

    const frame = document.getElementById("a");
    frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

    expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);
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

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
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

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
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

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);
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

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("removes the glitch class on animationend", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);

      frame.dispatchEvent(new CustomEvent("animationend", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
    });

    it("ignores animationend bubbling from a child element", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a"><span id="child"></span></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);

      // 子要素から animationend がバブルしてもクラスは残る
      document.getElementById("child").dispatchEvent(new CustomEvent("animationend", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);

      // 自身の animationend で除去される
      frame.dispatchEvent(new CustomEvent("animationend", { bubbles: true }));
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
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

    it("only marks newly-inserted children as appearing, not existing ones", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <ul id="list"><li id="existing">A</li></ul>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const list = document.getElementById("list");

      const fresh = document.createElement("li");
      fresh.id = "fresh";

      const stream = document.createElement("turbo-stream");
      stream.setAttribute("action", "append");
      stream.setAttribute("target", "list");

      // handleBeforeStreamRender は同期でスナップショットを取り、rAF 内で適用する。
      // ハンドラを呼んだ後に fresh を挿入することで「描画後」を模している。
      controller.handleBeforeStreamRender({ target: stream });
      list.appendChild(fresh);

      // rAF が発火するのを待つ
      await new Promise((r) => requestAnimationFrame(() => r()));
      // happy-dom で rAF が即時実行されない場合に備えてもう一tick待つ
      await nextTick();

      expect(document.getElementById("existing").classList.contains("turbo-fx--glitch-appearing")).toBe(false);
      expect(document.getElementById("fresh").classList.contains("turbo-fx--glitch-appearing")).toBe(true);
    });

    it("applies appearing even when the new child is inserted a few frames late", async () => {
      // 実ブラウザでは Turbo が before-stream-render の数フレーム後に DOM を挿入する。
      // rAF 1 回だけで差分を取ると挿入前で空になり、appearing が付かない回帰バグになる。
      // 挿入を遅延させても MutationObserver で検知して付与できることを保証する。
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <ul id="list"><li id="existing">A</li></ul>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const list = document.getElementById("list");

      const stream = document.createElement("turbo-stream");
      stream.setAttribute("action", "append");
      stream.setAttribute("target", "list");

      controller.handleBeforeStreamRender({ target: stream });

      // 2 フレーム後に挿入（Turbo の実挙動を模す）
      await new Promise((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => requestAnimationFrame(() => r()));
      const fresh = document.createElement("li");
      fresh.id = "fresh";
      list.appendChild(fresh);

      // MutationObserver のコールバックが回るのを待つ
      await nextTick();
      await nextTick();

      expect(document.getElementById("existing").classList.contains("turbo-fx--glitch-appearing")).toBe(false);
      expect(document.getElementById("fresh").classList.contains("turbo-fx--glitch-appearing")).toBe(true);
    });

    it("handles before-stream-render dispatched on document (turbo-stream renders at <html> root)", async () => {
      // 実ブラウザでは <turbo-stream> は <html> 直下に置かれ、before-stream-render は
      // document で発火する。コントローラのラッパ要素にはバブリングして来ないため、
      // document を監視していないと append が一切効かない（実機での回帰バグ）。
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <ul id="list"><li id="existing">A</li></ul>
        </div>
      `);
      await nextTick();

      // turbo-stream を <html> 直下（コントローラ配下の外）に置く実挙動を模す
      const stream = document.createElement("turbo-stream");
      stream.setAttribute("action", "append");
      stream.setAttribute("target", "list");
      document.documentElement.appendChild(stream);

      // stream 要素から bubbles:true で発火 → document まで伝播し、document 監視のハンドラが拾う。
      // （ラッパ要素は経路上に無いので、ラッパ監視のままでは拾えない）
      stream.dispatchEvent(new CustomEvent("turbo:before-stream-render", { bubbles: true }));

      // 挿入を遅延させる（Turbo の実挙動）
      await new Promise((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => requestAnimationFrame(() => r()));
      const fresh = document.createElement("li");
      fresh.id = "fresh";
      document.getElementById("list").appendChild(fresh);

      await nextTick();
      await nextTick();

      expect(document.getElementById("fresh").classList.contains("turbo-fx--glitch-appearing")).toBe(true);

      stream.remove();
    });

    it("applies glitch class for replace action", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <div id="target"></div>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const target = document.getElementById("target");

      controller.applyStreamEffect("replace", target, []);

      expect(target.classList.contains("turbo-fx--glitch")).toBe(true);
      expect(target.classList.contains("turbo-fx--glitch-appearing")).toBe(false);
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

      expect(inserted.classList.contains("turbo-fx--glitch-appearing")).toBe(true);
      expect(target.classList.contains("turbo-fx--glitch")).toBe(false);
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

      expect(target.classList.contains("turbo-fx--glitch")).toBe(false);
      expect(target.classList.contains("turbo-fx--glitch-appearing")).toBe(false);
    });
  });

  describe("nested controllers (README: per-frame duration override)", () => {
    // README の使い方例: 親に turbo_fx(:glitch)、frame に turbo_fx(:glitch, duration: 100)。
    // frame 自身にも data-controller="turbo-fx" が付くため、frame-render を
    // 子（ターゲットフェーズ）→ 親（バブリング）の順に両方が処理し、
    // 後から走る親が --turbo-fx-duration を既定値で上書きしてしまうバグの再現テスト。
    it("uses the frame's own duration value, not the ancestor's default", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" data-turbo-fx="glitch" id="root">
          <turbo-frame id="b" data-controller="turbo-fx" data-turbo-fx="glitch"
                       data-turbo-fx-duration-value="100"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("b");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);
      expect(frame.style.getPropertyValue("--turbo-fx-duration")).toBe("100ms");
    });

    it("still cleans up via the frame controller's own animationend listener", async () => {
      const app = startStimulus(`
        <div data-controller="turbo-fx" data-turbo-fx="glitch" id="root">
          <turbo-frame id="b" data-controller="turbo-fx" data-turbo-fx="glitch"
                       data-turbo-fx-duration-value="100"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("b");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));
      frame.dispatchEvent(new CustomEvent("animationend", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
    });
  });

  describe("effect resolution", () => {
    function controllerFor(html) {
      document.body.innerHTML = html;
      const app = Application.start();
      app.register("turbo-fx", TurboFxController);
      const root = document.getElementById("root");
      return { app, root };
    }

    it("applies turbo-fx--blur on frame render under data-turbo-fx='blur'", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" data-turbo-fx="blur" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--blur")).toBe(true);
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
    });

    it("applies turbo-fx--rgb-shift-appearing for append under data-turbo-fx='rgb-shift'", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" data-turbo-fx="rgb-shift" id="root">
          <div id="target"></div>
        </div>
      `);
      await nextTick();
      const controller = app.getControllerForElementAndIdentifier(root, "turbo-fx");
      const target = document.getElementById("target");
      const inserted = document.createElement("li");
      target.appendChild(inserted);

      controller.applyStreamEffect("append", target, [inserted]);

      expect(inserted.classList.contains("turbo-fx--rgb-shift-appearing")).toBe(true);
    });

    it("overrides the ancestor effect with the nearest data-turbo-fx", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" data-turbo-fx="glitch" id="root">
          <turbo-frame id="a" data-turbo-fx="flash"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--flash")).toBe(true);
      expect(frame.classList.contains("turbo-fx--glitch")).toBe(false);
    });

    it("applies nothing and warns for an unknown effect name", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" data-turbo-fx="sparkle" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.length).toBe(0);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("sparkle"));
      warn.mockRestore();
    });

    it("defaults to glitch when no data-turbo-fx attribute exists (existing behavior)", async () => {
      const { app, root } = controllerFor(`
        <div data-controller="turbo-fx" id="root">
          <turbo-frame id="a"></turbo-frame>
        </div>
      `);
      await nextTick();

      const frame = document.getElementById("a");
      frame.dispatchEvent(new CustomEvent("turbo:frame-render", { bubbles: true }));

      expect(frame.classList.contains("turbo-fx--glitch")).toBe(true);
    });
  });
});
