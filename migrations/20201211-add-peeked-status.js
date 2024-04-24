'use strict';
/**
 * Actions summary:
 *
 * changeColumn "status" on table "Notifications"
 *
 **/
var info = {
    "revision": 7,
    "name": "add-peeked-status",
    "created": "2020-12-11T12:42:03.502Z",
    "comment": ""
};
export const pos = 0;
export const useTransaction = true;
export const up = function (queryInterface) {
    return queryInterface.sequelize.query(`ALTER TYPE "enum_Notifications_status" ADD VALUE 'PEEKED'`);
};
export const down = function (queryInterface) {
    return queryInterface.sequelize.query(`DELETE FROM pg_enum WHERE enumlabel = 'PEEKED' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = 'enum_Notifications_status')`);
};
export { info };
export default {
    pos,
    useTransaction,
    up,
    down,
    info: info
};
