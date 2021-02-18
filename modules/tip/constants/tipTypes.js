const TIP_TYPES = {
  AE_TIP: 'AE_TIP',
  TOKEN_TIP: 'TOKEN_TIP',
  DIRECT_AE_TIP: 'DIRECT_AE_TIP',
  DIRECT_TOKEN_TIP: 'DIRECT_TOKEN_TIP',
  POST_WITHOUT_TIP: 'POST_WITHOUT_TIP',
};

const mapTipType = type => {
  switch (type) {
    case 'AeTip':
      return TIP_TYPES.AE_TIP;
    case 'TokenTip':
      return TIP_TYPES.TOKEN_TIP;
    case 'DirectAeTip':
      return TIP_TYPES.DIRECT_AE_TIP;
    case 'DirectTokenTip':
      return TIP_TYPES.DIRECT_TOKEN_TIP;
    case 'PostWithoutTip':
      return TIP_TYPES.POST_WITHOUT_TIP;
    default:
      throw Error(`unknown tip type ${type}`);
  }
};

module.exports = {
  TIP_TYPES, mapTipType,
};
