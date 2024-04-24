import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * add '_v1' postfix to
 *
 **/
var info = {
    "revision": 10,
    "name": "rename-blacklist-column",
    "created": "2021-02-24T11:50:10.521Z",
    "comment": ""
};
export const pos = 0;
export const useTransaction = true;
export const up = async function (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "BlacklistEntries" RENAME COLUMN "flagger" TO "author" ;', { transaction: transaction });
    return transaction.commit();
};
export const down = async function (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "BlacklistEntries" RENAME COLUMN "author" TO "flagger" ;', { transaction: transaction });
    return transaction.commit();
};
export { info };
export default {
    pos,
    useTransaction,
    up,
    down,
    info: info
};
