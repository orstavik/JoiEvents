function deepDiff(objectA, objectB) {

  let isNotSpecialObject = function (a) {
    const c = a.constructor;
    return c !== Number && c !== String && c !== Date && c !== RegExp && c !== Function && c !== Boolean;
  };
  var isObject = function (a) {
    if (a === undefined)
      return false;
    return a.constructor == Object || isNotSpecialObject(a);
  };

  var isArray = function (a) {
    return a.constructor == Array;
  };
  let diffEntry = function (path, a, b) {
    path = path.map(seg => typeof seg === "number" ? `[${seg}]` : "." + seg)
      .join("");
    a = (a === undefined ? "__undefined__" : a);
    b = (b === undefined ? "__undefined__" : b);
    return {path: path, "+": a, "-": b};
  };
  var compare = function (a, b, path) {
    if (a === b || (Number.isNaN(a) && Number.isNaN(b)))
      return [];
    if (a === Function && b === Function)     //filter out functions
      return [];
    if (!a || !b || !a.constructor || !b.constructor)
      return [diffEntry(path, a, b)];
    if (isArray(a) && !isArray(b))
      return [diffEntry(path, a, b)];
    if (!isArray(a) && isArray(b))
      return [diffEntry(path, a, b)];
    if (isArray(a) && isArray(b)) {
      let res = [];
      for (var i = 0; i < a.length; i++) {
        b.length > i ?
          res = res.concat(compare(a[i], b[i], path.concat([i]))) :
          res.push(diffEntry(path.concat([i]), a[i], "__void__"));
      }
      for (var i = a.length; i < b.length; i++)
        res.push(diffEntry(path.concat([i]), "__void__", b[i]));
      return res;
    }
    if (isObject(a) && !isObject(b))
      return [diffEntry(path, a, b)];
    if (!isObject(a) && isObject(b))
      return [diffEntry(path, a, b)];
    if (isObject(a) && isObject(b)) {
      let res = [];
      for (let prop in a) {
        prop in b ?
          res = res.concat(compare(a[prop], b[prop], path.concat([prop]))) :
          res.push(diffEntry(path.concat([prop]), a[prop], "__void__"));
      }
      for (let prop in b)
        !(prop in a) && res.push(diffEntry(path.concat([prop]), "__void__", b[prop]));
      return res;
    }
    return [diffEntry(path, a, b)];
  };

  var propertyChanges = compare(objectA, objectB, []);

  if (!propertyChanges.length)
    return true;
  return JSON.stringify(propertyChanges);//, null, 2);
}