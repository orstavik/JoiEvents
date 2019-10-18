export const ListOps = Object.create(null);
ListOps.topDown = {":": 1};

ListOps[":"] = function ({left, right}) {
  const res = [left];
  while (right && right.type === ":"){
    res.push(right.left);
    right = right.right;
  }
  res.push(right);
  return res;
};