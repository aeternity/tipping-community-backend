"use strict";
/**
 * Actions summary:
 *
 * drop broken link previews
 *
 **/
var info = {
  revision: 28,
  name: "remove-wrong-preview-images",
  created: "2021-07-29T12:42:03.502Z",
  comment: "",
};
export const pos = 0;
export const useTransaction = true;
export const up = function (queryInterface) {
  return queryInterface.sequelize.query(`UPDATE "LinkPreviews" SET image = null WHERE image = '/images/undefined'`);
};
export const down = () => {};
export { info };
export default {
  pos,
  useTransaction,
  up,
  down,
  info: info,
};
