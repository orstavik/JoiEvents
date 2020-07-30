//<select>
//  <option1>
//  <div>
//    <option2>
//  <optgroup>
//    <option3>
//    <span>
//      <option4>
function makeFormBranch() {
  const form = document.createElement("form");
  const button = document.createElement("button");
  button.type = "reset";
  const input = document.createElement("input");
  input.type = "reset";
  form.appendChild(button);
  form.appendChild(input);
  return {form, input, button};
}

//form
//  button[type=reset]
function formButtonReset() {
  const {form, button} = makeFormBranch();
  const usecase = [button, form];
  Object.freeze(usecase);
  return usecase;
}

export const formUseCases = {
  formButtonReset
};
Object.freeze(formUseCases);