import { topicsRegex } from "../modules/aeternity/utils/tipTopicUtil.js";
const basicTippingContractUtil = {};
const aggregateStates = (states, formatFunction) => states.reduce((acc, cur) => {
    if (!cur.result || !cur.decodedResult)
        throw Error('full returned tx state must be passed');
    const tips = formatFunction(cur);
    return acc.concat(tips);
}, []);
const findUrl = (urlId, urls) => urls.find(([_, id]) => urlId === id)[0];
const formatSingleClaim = (contractId, url, [claimGen, amount]) => {
    const data = {};
    data.contractId = contractId;
    data.url = url;
    data.claimGen = claimGen;
    data.amount = String(amount);
    return data;
};
const formatClaims = returnState => {
    const state = returnState.decodedResult;
    return state.claims && state.urls ? state.claims.map(([url_id, rawClaim]) => {
        const contractId = returnState.result.contractId;
        const url = findUrl(url_id, state.urls);
        return formatSingleClaim(contractId, url, rawClaim);
    }) : [];
};
const formatSingleRetip = (contractId, suffix, id, tipTypeData) => {
    const data = tipTypeData;
    data.id = id + suffix;
    data.tipId = data.tip_id + suffix;
    data.contractId = contractId;
    data.claimGen = data.claim_gen === 'None' || data.claim_gen === undefined ? null : data.claim_gen;
    data.token = data.token !== undefined ? data.token : null;
    data.tokenAmount = data.token_amount ? data.token_amount : '0';
    // formatting
    delete data.claim_gen;
    delete data.tip_id;
    return data;
};
const formatRetips = returnState => {
    const state = returnState.decodedResult;
    const suffix = `_${state.version || 'v1'}`;
    return state.retips ? state.retips.map(([id, tipTypeData]) => formatSingleRetip(returnState.result.contractId, suffix, id, tipTypeData)) : [];
};
const rawTipUrlId = (tipTypeData) => {
    const [tipType, tipData] = Object.entries(tipTypeData)[0];
    switch (tipType) {
        case 'AeTip':
            return tipData[1];
        case 'TokenTip':
            return tipData[1];
        case 'DirectAeTip':
            return null;
        case 'DirectTokenTip':
            return null;
        case 'PostWithoutTip':
            return null;
        default:
            return tipTypeData.url_id;
    }
};
const formatSingleTip = (contractId, suffix, id, tipTypeData, url) => {
    const [tipType, tipData] = Object.entries(tipTypeData)[0];
    switch (tipType) {
        case 'AeTip':
            data = tipData[0];
            data.type = 'AE_TIP';
            data.amount = tipData[2];
            data.claimGen = tipData[3];
            break;
        case 'TokenTip':
            data = tipData[0];
            data.type = 'TOKEN_TIP';
            data.token = tipData[2].token;
            data.tokenAmount = tipData[2].amount;
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
        case 'PostViaBurn':
            data = tipData[0];
            data.type = 'POST_VIA_BURN';
            data.media = tipData[1];
            data.token = tipData[2];
            data.tokenAmount = tipData[3];
            break;
        default:
            data = tipTypeData; // Fallback for old contract state format
            data.type = 'AE_TIP';
            data.claimGen = data.claim_gen;
            break;
    }
    data.id = id + suffix;
    data.contractId = contractId;
    data.url = url;
    data.claimGen = data.claimGen === 'None' || data.claimGen === undefined ? null : data.claimGen;
    data.media = data.media || [];
    // formatting
    data.urlId = data.url_id;
    delete data.claim_gen;
    delete data.url_id;
    data.token = data.token !== undefined ? data.token : null;
    data.tokenAmount = data.tokenAmount ? data.tokenAmount : '0';
    data.topics = [...new Set(data.title.match(topicsRegex))].map(x => x.toLowerCase());
    return data;
};
const formatTips = returnState => {
    const state = returnState.decodedResult;
    const suffix = `_${state.version || 'v1'}`;
    return state.tips.map(([id, tipTypeData]) => {
        const urlId = rawTipUrlId(tipTypeData);
        const url = urlId !== null && state.urls ? findUrl(urlId, state.urls) : null;
        return formatSingleTip(returnState.result.contractId, suffix, id, tipTypeData, url);
    });
};
basicTippingContractUtil.getRetips = states => aggregateStates(states, formatRetips);
basicTippingContractUtil.getTips = states => aggregateStates(states, formatTips);
basicTippingContractUtil.getClaims = states => aggregateStates(states, formatClaims);
basicTippingContractUtil.formatSingleRetip = formatSingleRetip;
basicTippingContractUtil.formatSingleTip = formatSingleTip;
basicTippingContractUtil.formatSingleClaim = formatSingleClaim;
basicTippingContractUtil.rawTipUrlId = rawTipUrlId;
export default basicTippingContractUtil;
