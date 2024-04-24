import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * alter functions to add public search path
 *
 **/
var info = {
    "revision": 26,
    "name": "fix-function-search-path",
    "created": "2021-06-18T11:11:39.431Z",
    "comment": ""
};
export const pos = 0;
export const useTransaction = true;
export const up = async function (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.sequelize.query('ALTER FUNCTION unclaimed(numeric, text, varchar) SET search_path=public;', { transaction });
    await queryInterface.sequelize.query('ALTER FUNCTION unclaimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
    await queryInterface.sequelize.query('ALTER FUNCTION claimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
    return transaction.commit();
};
export const down = () => { };
export { info };
export default {
    pos,
    useTransaction,
    up,
    down,
    info: info
};
