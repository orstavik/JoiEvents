export const ListOps = Object.create(null);
ListOps.topDown = {"+": 1, "-": 1};

// ListOps["()"] = function (node) {
//   return {type: "()", body: ListOps["[]"](node)};
// };
//
// function commaTreeToArray(body) {
//   const res = [];
//   let ops = [];
//   for (let root = body; root !== undefined; root = root.right) {
//     ops.push(root);
//     if (root.type === ",") {
//       res.push(ops);
//       ops = [];
//     }
//   }
//   res.push(ops);
//   return res;
// }
//
// ListOps["[]"] = function ({body}) {
//   if (!body)
//     return [];
//   if (!body.left && !body.right)            //no operators, single body
//     return [body];
//   const res = commaTreeToArray(body);
//   for (let i = 0; i < res.length - 1; i++) {
//     const row = res[i].map(node => Object.assign({}, node));
//     if (row[row.length - 1].type === ",")                   //replace the comma with the left side of the comma
//       row[row.length - 1] = row[row.length - 1].left;
//     for (let j = 0; j < row.length - 1; j++)                //update the links in the clone that is needed to avoid mutations
//       row[j].right = row[j + 1];
//     res[i] = row;
//   }
//   return res.map(row => row[0]);
// };

ListOps[":"] = function ({left, right}) {
  if (!right || !(right instanceof Array))
    return [left, right];
  right.unshift(left);
  return right;
};