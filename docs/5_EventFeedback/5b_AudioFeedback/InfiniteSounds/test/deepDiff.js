var display = document.createElement('pre');
document.body.prepend(display);

function diffToHTML(one, other) {
  let diff = JsDiff.diffJson(one, other);
  let fragment = document.createDocumentFragment();

  for (let part of diff) {
    let color = part.added ? 'green' :        // green for additions, red for deletions
      part.removed ? 'red' : 'grey';          // grey for common parts
    let span = document.createElement('span');
    span.style.color = color;
    span.appendChild(document
      .createTextNode(part.value));
    fragment.appendChild(span);
  }
  return fragment;
}

window.bigDiff = function(a, b){
  display.appendChild(diffToHTML(a, b));
};

// bigDiff('beep boop', 'beep boob blah');