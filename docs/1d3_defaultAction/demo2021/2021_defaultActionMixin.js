(function () {

  const span = document.querySelector("span");
  const a = document.querySelector("a");
  const summary = document.querySelector("summary");

  addEventListener("hashchange", e => console.log(e.type));
  addEventListener("click", e => console.log(e.type));
  addEventListener("dblclick", e => console.log(e.type));
  addEventListener("toggle", e => console.log(e.type), true);

  let count = 0;
  addEventListener("click", e => count++);
  addEventListener("click", e => a.href = "#sunshine" + count);

  addEventListener("click", e => {
    if (count % 4)
      return;
    summary.appendChild(span);
  });
})();
