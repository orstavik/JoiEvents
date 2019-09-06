(function () {

  function removePseudoPseudoClasses(input) {
    input.classList.remove("input-altered");
    input.classList.remove("input-reset");
    input.classList.remove("input-submitted");
  }

  //make sure the "checked" attribute in the DOM is in sync with the checked property
  //now, the CSS querySelectors can use [checked] to query if the checkbox or radiobutton is checked.
  //this essentially renders the :checked pseudo-class redundant.
  function correctCheckedAttribute(input) {
    if (input.checked && !input.hasAttribute("checked"))
      input.setAttribute("checked", "");
    else if (!input.checked && input.hasAttribute("checked"))
      input.removeAttribute("checked");
  }

  function correctCheckedAndAddPseudoPseudo(input) {
    if (input.defaultCheckedOG === undefined)
      input.defaultCheckedOG = input.defaultChecked;
    correctCheckedAttribute(input);

    removePseudoPseudoClasses(input);
    if (input.defaultCheckedOG !== input.checked)
      input.classList.add("input-altered");
    else
      input.classList.add("input-reset");
  }

  function onSubmit(e) {
    for (let input of Array.from(e.target.elements)) {
      if (input.type === "radio" || input.type === "checkbox") {
        input.defaultCheckedOG = input.checked;
        removePseudoPseudoClasses(input);
        correctCheckedAttribute(input);
        input.classList.add("input-submitted");
      }
    }
  }

  function onInput(e) {
    if (e.target.type === "checkbox")
      correctCheckedAndAddPseudoPseudo(e.target);
    if (e.target.type === "radio") {
      const allInputs = Array.from(e.target.form.elements);
      const targetRadioGroup = allInputs.filter(el => el.type === "radio" && el.name === e.target.name);
      for (let radio of targetRadioGroup)
        correctCheckedAndAddPseudoPseudo(radio);
    }
  }

  window.addEventListener("input", onInput, true);
  window.addEventListener("submit", onSubmit, true);
})();