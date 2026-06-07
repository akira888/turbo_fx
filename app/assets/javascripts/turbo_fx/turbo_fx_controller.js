import { Controller } from "@hotwired/stimulus";

// 親要素に 1 つ置かれ、配下の Turbo 更新イベントをバブリングで捕捉する。
export default class extends Controller {
  static values = {
    duration: { type: Number, default: 500 }
  };

  connect() {
    this.onFrameRender = this.handleFrameRender.bind(this);
    this.onBeforeStreamRender = this.handleBeforeStreamRender.bind(this);

    this.element.addEventListener("turbo:frame-render", this.onFrameRender);
    this.element.addEventListener("turbo:before-stream-render", this.onBeforeStreamRender);
  }

  disconnect() {
    this.element.removeEventListener("turbo:frame-render", this.onFrameRender);
    this.element.removeEventListener("turbo:before-stream-render", this.onBeforeStreamRender);
  }

  handleFrameRender(event) {
    const target = event.target;
    if (!this.shouldApply(target)) return;
    this.applyEffect(target, "turbo-fx--glitching");
  }

  handleBeforeStreamRender(event) {
    const stream = event.target;
    const action = stream.getAttribute("action");
    const targetId = stream.getAttribute("target");
    if (!targetId) return;

    // 描画は before イベントの後。描画後の DOM に対して適用する。
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      // 出現系では template の中身が target の子として挿入される。
      const inserted = Array.from(target.children);
      this.applyStreamEffect(action, target, inserted);
    });
  }

  // action に応じて適切な要素へ適切なクラスを付与する純粋ロジック。
  applyStreamEffect(action, target, insertedEls) {
    if (action === "replace" || action === "update") {
      if (!this.shouldApply(target)) return;
      this.applyEffect(target, "turbo-fx--glitching");
    } else if (action === "append" || action === "prepend") {
      insertedEls.forEach((el) => {
        if (!this.shouldApply(el)) return;
        this.applyEffect(el, "turbo-fx--appearing");
      });
    }
    // remove など、それ以外の action は何もしない。
  }

  // 対象要素にエフェクトを適用する共通処理。
  applyEffect(target, className) {
    target.style.setProperty("--turbo-fx-duration", `${this.durationValue}ms`);
    target.classList.add(className);
  }

  // この要素にエフェクトを効かせるべきか（off 判定は Task 12 で実装）。
  shouldApply(target) {
    return true;
  }
}
