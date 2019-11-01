export const StringOps = Object.create(null);

StringOps["+"] = function (n) {
  const [l, r] = n.body;
  if (typeof l !== "string" && typeof r !== "string")   //if one is a string, then we concatenate
    return n;
  return l + r;
};
