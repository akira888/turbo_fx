import { Controller } from "@hotwired/stimulus";

// 親要素に 1 つ置かれ、配下の Turbo 更新イベントをバブリングで捕捉する。
export default class extends Controller {
  static values = {
    duration: { type: Number, default: 500 }
  };

  get aborters() {
    if (!this._aborters) this._aborters = new WeakMap();
    return this._aborters;
  }

  connect() {
    this.onFrameRender = this.handleFrameRender.bind(this);
    this.onBeforeStreamRender = this.handleBeforeStreamRender.bind(this);

    // Turbo Frame の render イベントは frame 要素自身（コントローラ配下）で発火し、
    // バブリングで this.element に届くため、ラッパで監視できる。
    this.element.addEventListener("turbo:frame-render", this.onFrameRender);

    // 一方 <turbo-stream> は処理中に <html> 直下へ挿入され、before-stream-render は
    // そこで発火する。コントローラのラッパにはバブリングして来ないため、document で監視する。
    document.addEventListener("turbo:before-stream-render", this.onBeforeStreamRender);
  }

  disconnect() {
    this.element.removeEventListener("turbo:frame-render", this.onFrameRender);
    document.removeEventListener("turbo:before-stream-render", this.onBeforeStreamRender);
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

    const target = document.getElementById(targetId);
    if (!target) return;

    // document 監視のため、ページ上の全 turbo-fx コントローラがこのイベントを受け取る
    // 自分の配下（this.element 内）の target だけを担当する
    if (!this.element.contains(target)) return;

    if (action === "replace" || action === "update") {
      this.applyStreamEffect(action, target, []);
      return;
    }

    // 出現系（append / prepend）は、Turbo が DOM を挿入するのが
    // before-stream-render の数フレーム後になることがある（rAF 1 回では間に合わない）。
    // そこで MutationObserver で実際の子要素挿入を待ち、新規挿入分だけにエフェクトを当てる。
    if (action === "append" || action === "prepend") {
      this.observeInsertion(target, action);
    }
    // remove など、それ以外の action は何もしない。
  }

  // target への子要素挿入を MutationObserver で監視し、挿入された新要素に出現系エフェクトを当てる
  observeInsertion(target, action) {
    const before = new Set(Array.from(target.children));

    const observer = new MutationObserver(() => {
      const inserted = Array.from(target.children).filter((el) => !before.has(el));
      if (inserted.length === 0) return;
      observer.disconnect();
      this.applyStreamEffect(action, target, inserted);
    });

    observer.observe(target, { childList: true });

    // 取りこぼし防止の保険: 一定時間で監視を打ち切る（挿入が来なければ何もしない）
    setTimeout(() => observer.disconnect(), 1000);
  }

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
    // remove など、それ以外の action は何もしない
  }

  // 対象要素にエフェクトを適用する共通処理
  // すでに同クラスが付いている場合は一旦外して reflow し、アニメを頭から再生する
  // animationend でクラスを除去して後始末する
  applyEffect(target, className) {
    target.style.setProperty("--turbo-fx-duration", `${this.durationValue}ms`);

    // 前回の applyEffect で登録した animationend リスナーを破棄し、積み上がりを防ぐ
    const prevAbort = this.aborters.get(target);
    if (prevAbort) prevAbort.abort();

    const abortController = new AbortController();
    this.aborters.set(target, abortController);

    if (target.classList.contains(className)) {
      target.classList.remove(className);
      // 強制 reflow: 読み取ることでブラウザにスタイル再計算をさせ、アニメをリセットする
      void target.offsetWidth;
    }

    target.addEventListener(
      "animationend",
      (event) => {
        // 子孫からバブルした animationend は無視し、自身のアニメ終了でのみ後始末する
        if (event.target !== target) return;
        target.classList.remove(className);
        abortController.abort();
      },
      { signal: abortController.signal }
    );

    target.classList.add(className);
  }

  // 対象自身から祖先方向に最も近い data-turbo-fx を探し、off なら適用しない
  shouldApply(target) {
    const scoped = target.closest("[data-turbo-fx]");
    if (scoped && scoped.getAttribute("data-turbo-fx") === "off") {
      return false;
    }
    return true;
  }
}
