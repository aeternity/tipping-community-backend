const NOTIFICATION_TYPES = {
  COMMENT_ON_COMMENT: 'COMMENT_ON_COMMENT',
  COMMENT_ON_TIP: 'COMMENT_ON_TIP',
  TIP_ON_COMMENT: 'TIP_ON_COMMENT',
  RETIP_ON_TIP: 'RETIP_ON_TIP',
  CLAIM_OF_TIP: 'CLAIM_OF_TIP',
  CLAIM_OF_RETIP: 'CLAIM_OF_RETIP', // TIPID + RETIP ID + NOTIFICATION_TYPE ARE ENOUGH
};
const NOTIFICATION_STATES = {
  CREATED: 'CREATED',
  PEEKED: 'PEEKED',
  READ: 'READ',
};
const ENTITY_TYPES = {
  COMMENT: 'COMMENT',
  TIP: 'TIP',
};
const SOURCE_TYPES = {
  COMMENT: 'COMMENT',
  TIP: 'TIP',
  RETIP: 'RETIP',
  CLAIM: 'CLAIM',
};
export { NOTIFICATION_TYPES };
export { NOTIFICATION_STATES };
export { ENTITY_TYPES };
export { SOURCE_TYPES };
export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATES,
  ENTITY_TYPES,
  SOURCE_TYPES,
};
