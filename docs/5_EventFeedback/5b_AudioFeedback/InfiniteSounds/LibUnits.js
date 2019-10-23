export const Units = Object.create(null);

Units["hz"] = function ({body: [num]}) {
  return num;
};
Units["mhz"] = function ({body: [num]}) {
  return num * 1000;
};
Units["ms"] = function ({body: [num]}) {
  return num / 1000;
};
Units["s"] = function ({body: [num]}) {
  return num;
};