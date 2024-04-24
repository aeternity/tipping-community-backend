const EVENT_TYPES = {
  TIP_RECEIVED: 'TipReceived',
  TIP_TOKEN_RECEIVED: 'TipTokenReceived',
  RETIP_RECEIVED: 'ReTipReceived',
  RETIP_TOKEN_RECEIVED: 'ReTipTokenReceived',
  TIP_DIRECT_RECEIVED: 'TipDirectReceived',
  TIP_DIRECT_TOKEN_RECEIVED: 'TipDirectTokenReceived',
  POST_WITHOUT_TIP_RECEIVED: 'PostWithoutTipReceived',
  POST_VIA_BURN_RECEIVED: 'PostViaBurnReceived',
  TIP_WITHDRAWN: 'TipWithdrawn',
  QUERY_ORACLE: 'QueryOracle',
  CHECK_PERSIST_CLAIM: 'CheckPersistClaim',
  TRANSFER: 'Transfer',
  ALLOWANCE: 'Allowance',
};
export { EVENT_TYPES };
export default {
  EVENT_TYPES,
};
