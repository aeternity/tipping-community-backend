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

module.exports = {
    pos: 0,
    useTransaction: true,
    up: function(queryInterface)
    {
      return queryInterface.sequelize.query(`ALTER TYPE "enum_Notifications_status" ADD VALUE 'PEEKED'`);
    },
    down: function(queryInterface)
    {
      const query = `DELETE FROM pg_enum WHERE enumlabel = 'PEEKED' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = 'enum_Notifications_status')`;
      return queryInterface.sequelize.query(query);
    },
    info: info
};
