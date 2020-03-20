const BigNumber = require('bignumber.js');

const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000));
const aeToAtoms = (ae) => (new BigNumber(ae)).times(new BigNumber(1000000000000000000));
const wrapTry = async (f) => {
  try {
    return Promise.race([
      f().then(res => {
        if (!res.statusText === 'OK') throw new Error(`Request failed with ${res.status}`);
        return res.data;
      }),
      new Promise(function (resolve, reject) {
        setTimeout(reject, 3000, 'TIMEOUT');
      })
    ])
  } catch (e) {
    console.error("backend error", e);
    return null;
  }
};

module.exports = {
  atomsToAe,
  aeToAtoms,
  wrapTry
};
