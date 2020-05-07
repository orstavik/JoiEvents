Object.defineProperties(HTMLDetailsElement.prototype, {
  requestToggle: {
    value: function () {
      (window["toggleTick"] || setTimeout)(() => (this.open = !this.open) & this.dispatchEvent(new Event("toggle")));
    }
  },
  joiGetNativeAction: {
    value: function (e) {
      if (!(e instanceof MouseEvent) || !e.isTrusted || e.type !== "click" || e.button !== 0)
        return;
      const propPath = e.composedPath();
      const firstSummaryIndex = this.querySelector("summary");
      if (propPath.indexOf(this)-propPath.indexOf(firstSummaryIndex) === 1)
        return () => this.requestToggle();
    }
  },
});