const { topicsRegex } = require('../modules/aeternity/utils/tipTopicUtil');

const basicTippingContractUtil = {};

const aggregateStates = (states, formatFunction) => states.reduce((acc, cur) => {
  if (!cur.result || !cur.decodedResult) throw Error('full returned tx state must be passed');
  const tips = formatFunction(cur);
  return acc.concat(tips);
}, []);

const findUrl = (urlId, urls) => urls.find(([_, id]) => urlId === id)[0];

const formatClaims = returnState => {
  const state = returnState.decodedResult;

  return state.claims ? state.claims.map(([url_id, [claim_gen, amount]]) => {
    const data = {};

    data.contractId = returnState.result.contractId;
    data.url = findUrl(url_id, state.urls);
    data.claimGen = claim_gen;
    data.amount = String(amount);

    return data;
  }) : [];
};

const formatRetips = returnState => {
  const state = returnState.decodedResult;
  const suffix = `_${state.version || 'v1'}`;

  return state.retips ? state.retips.map(([id, tipTypeData]) => {
    const data = tipTypeData;
    data.id = id + suffix;
    data.tipId = data.tip_id + suffix;
    data.contractId = returnState.result.contractId;
    data.claimGen = data.claim_gen === 'None' || data.claim_gen === undefined ? null : data.claim_gen;
    data.token = data.token !== undefined ? data.token : null;
    data.tokenAmount = data.token_amount ? data.token_amount : '0';

    return data;
  }) : [];
};

const formatTips = returnState => {
  const state = returnState.decodedResult;
  const suffix = `_${state.version || 'v1'}`;

  return state.tips.map(([id, tipTypeData]) => {
    const [tipType, tipData] = Object.entries(tipTypeData)[0];
    switch (tipType) {
      case 'AeTip':
        data = tipData[0];
        data.type = 'AE_TIP';
        data.urlId = tipData[1];
        data.amount = tipData[2];
        data.claimGen = tipData[3];
        break;
      case 'TokenTip':
        data = tipData[0];
        data.type = 'TOKEN_TIP';
        data.urlId = tipData[1];
        data.token = tipData[2].token;
        data.token_amount = tipData[2].amount;
        data.claimGen = tipData[3];
        data.amount = 0;
        break;
      case 'DirectAeTip':
        data = tipData[0];
        data.type = 'DIRECT_AE_TIP';
        data.receiver = tipData[1];
        data.amount = tipData[2];
        break;
      case 'DirectTokenTip':
        data = tipData[0];
        data.type = 'DIRECT_TOKEN_TIP';
        data.receiver = tipData[1];
        data.token = tipData[2].token;
        data.tokenAmount = tipData[2].amount;
        data.amount = 0;
        break;
      case 'PostWithoutTip':
        data = tipData[0];
        data.type = 'POST_WITHOUT_TIP';
        data.media = tipData[1];
        data.amount = 0;
        break;
      default:
        data = tipTypeData; // Fallback for old contract state format
        data.type = 'AE_TIP';
        break;
    }

    data.id = id + suffix;
    data.contractId = returnState.result.contractId;

    data.url = data.url_id !== undefined ? findUrl(data.url_id, state.urls) : null;

    data.claimGen = data.claim_gen === 'None' || data.claim_gen === undefined ? null : data.claim_gen;

    data.token = data.token !== undefined ? data.token : null;
    data.tokenAmount = data.token_amount ? data.token_amount : '0';
    data.topics = [...new Set(data.title.match(topicsRegex))].map(x => x.toLowerCase());

    return data;
  });
};

basicTippingContractUtil.getRetips = states => aggregateStates(states, formatRetips);

basicTippingContractUtil.getTips = states => aggregateStates(states, formatTips);

basicTippingContractUtil.getClaims = states => aggregateStates(states, formatClaims);

module.exports = basicTippingContractUtil;
