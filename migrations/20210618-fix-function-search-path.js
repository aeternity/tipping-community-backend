'use strict';

var Sequelize = require('sequelize');

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

module.exports = {
    pos: 0,
    useTransaction: true,

    up: async function(queryInterface)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('ALTER FUNCTION unclaimed(numeric, text, varchar) SET search_path=public;', { transaction });
      await queryInterface.sequelize.query('ALTER FUNCTION unclaimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
      await queryInterface.sequelize.query('ALTER FUNCTION claimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
      return transaction.commit();
    },
    down: () => {},

    info: info
};
