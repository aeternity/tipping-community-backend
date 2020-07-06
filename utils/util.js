const BigNumber = require('bignumber.js');

const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000));
const aeToAtoms = (ae) => (new BigNumber(ae)).times(new BigNumber(1000000000000000000));

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

const groupBy = (xs, key) => xs.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] || []).concat(x) }), {});

module.exports = {
  atomsToAe,
  aeToAtoms,
  groupBy,
};
