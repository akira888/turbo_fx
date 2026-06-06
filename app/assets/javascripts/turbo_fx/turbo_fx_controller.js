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
    // Task 10 で実装
  }

  handleBeforeStreamRender(event) {
    // Task 11 で実装
  }
}
