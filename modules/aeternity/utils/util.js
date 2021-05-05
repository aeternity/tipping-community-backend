Array.prototype.asyncMap = async function (asyncF) {
  return this.reduce(async (promiseAcc, cur) => {
    const acc = await promiseAcc;
    const res = await asyncF(cur);
    if (Array.isArray(res)) {
      return acc.concat(res);
    }
    if (res) acc.push(res);
    return acc;
  }, Promise.resolve([]));
};
