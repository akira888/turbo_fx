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
    // Task 11 で実装
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
