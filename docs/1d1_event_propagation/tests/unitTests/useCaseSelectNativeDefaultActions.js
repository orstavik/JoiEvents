//<select>
//  <option1>
//  <div>
//    <option2>
//  <optgroup>
//    <option3>
//    <span>
//      <option4>
export function makeSelectBranch() {
  const select = document.createElement("select");
  const option1 = document.createElement("option");
  const div = document.createElement("div");
  const option2 = document.createElement("option");
  const optgroup = document.createElement("optgroup");
  const option3 = document.createElement("option");
  const span = document.createElement("span");
  const option4 = document.createElement("option");
  select.appendChild(option1);
  select.appendChild(div);
  div.appendChild(option2);
  select.appendChild(optgroup);
  optgroup.appendChild(option3);
  optgroup.appendChild(span);
  span.appendChild(option4);
  return {select, option1, option2, option3, option4, optgroup, span, div};
}

//select
//  option
export function selectOption() {
  const {select, option1} = makeSelectBranch();
  const usecase = [option1, select];
  Object.freeze(usecase);
  return usecase;
}

//select
//  div
//    option
export function selectDivOption() {
  const {select, div, option2} = makeSelectBranch();
  const usecase = [option2, div, select];
  Object.freeze(usecase);
  return usecase;
}

//select
//  optgroup
//    option
export function selectOptgroupOption() {
  const {select, option3, optgroup} = makeSelectBranch();
  const usecase = [option3, optgroup, select];
  Object.freeze(usecase);
  return usecase;
}

//select
//  optgroup
//    span
//      option
export function selectOptgroupSpanOption() {
  const {select, option4, optgroup, span} = makeSelectBranch();
  const usecase = [option4, span, optgroup, select];
  Object.freeze(usecase);
  return usecase;
}

export const selectUseCases = {
  selectOption,
  selectOptgroupOption,
};
Object.freeze(selectUseCases);

export const selectUseCasesError = {
  selectDivOption,
  selectOptgroupSpanOption
};
Object.freeze(selectUseCasesError);