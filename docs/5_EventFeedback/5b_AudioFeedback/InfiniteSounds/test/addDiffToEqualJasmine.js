(function () {

  var diffCounter = 0;

  function diffToHTML(one, other) {
    var display = document.createElement('pre');
    document.body.prepend(display);
    let diff = JsDiff.diffJson(one, other);
    let fragment = document.createDocumentFragment();

    for (let part of diff) {
      let color = part.added ? 'green' :        // green for additions, red for deletions
        part.removed ? 'red' : 'grey';          // grey for common parts
      let span = document.createElement('span');
      span.style.color = color;
      span.innerText = part.value;
      fragment.appendChild(span);
    }
    display.appendChild(fragment);
    const id = "___DiffInJasmine___" + diffCounter++;
    display.id = id;
    display.classList.add("diffinjasmine");
    return id;
  }

  window.expectToEqualWithDiff = function (a, b) {
    const env = expect(a);
    const hacked = env.expector.processResult.bind(env.expector);
    env.expector.processResult = function (a, b) {
      if (a.pass)
        return hacked(a, b);
      a.message += diffToHTML(this.actual, this.expected[0]);
      hacked(a, b);
    };
    env.toEqual(b);
  };
})();

function moveDiffResult() {
  const diffs = document.querySelectorAll("pre.diffinjasmine");
  const targets = document.querySelectorAll(".jasmine-result-message");
  for (let diff of diffs) {
    for (let candidate of targets) {
      if (candidate.innerText.endsWith(diff.id)) {
        candidate.innerText = candidate.innerText.substr(0, candidate.innerText.length - diff.id.length);
        candidate.append(diff);
      }
    }
  }
}

setInterval(moveDiffResult, 1000);