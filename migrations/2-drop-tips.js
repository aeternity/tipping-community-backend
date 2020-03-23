'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * dropTable "Tips", deps: []
 *
 **/

var info = {
  "revision": 2,
  "name": "drop-tips",
  "created": "2020-03-23T18:10:20.546Z",
  "comment": ""
};

var migrationCommands = function (transaction) {
  return [{
    fn: "dropTable",
    params: ["Tips", {
      transaction: transaction
    }]
  }];
};

var rollbackCommands = function (transaction) {
  return [{
    fn: "createTable",
    params: [
      "Tips",
      {
        "id": {
          "type": Sequelize.INTEGER,
          "field": "id",
          "autoIncrement": true,
          "primaryKey": true,
          "allowNull": false
        },
        "tipId": {
          "type": Sequelize.STRING,
          "field": "tipId",
          "unique": true,
          "allowNull": false
        },
        "url": {
          "type": Sequelize.STRING,
          "field": "url",
          "allowNull": false
        },
        "sender": {
          "type": Sequelize.STRING,
          "field": "sender",
          "allowNull": false
        },
        "timestamp": {
          "type": Sequelize.STRING,
          "field": "timestamp",
          "allowNull": false
        },
        "amount": {
          "type": Sequelize.STRING,
          "field": "amount",
          "allowNull": false
        },
        "title": {
          "type": Sequelize.STRING,
          "field": "title",
          "allowNull": true
        },
        "createdAt": {
          "type": Sequelize.DATE,
          "field": "createdAt",
          "allowNull": false
        },
        "updatedAt": {
          "type": Sequelize.DATE,
          "field": "updatedAt",
          "allowNull": false
        }
      },
      {
        "transaction": transaction
      }
    ]
  }];
};

module.exports = {
  pos: 0,
  useTransaction: true,
  execute: function (queryInterface, Sequelize, _commands) {
    var index = this.pos;

    function run(transaction) {
      const commands = _commands(transaction);
      return new Promise(function (resolve, reject) {
        function next() {
          if (index < commands.length) {
            let command = commands[index];
            console.log("[#" + index + "] execute: " + command.fn);
            index++;
            queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
          } else
            resolve();
        }

        next();
      });
    }

    if (this.useTransaction) {
      return queryInterface.sequelize.transaction(run);
    } else {
      return run(null);
    }
  },
  up: function (queryInterface, Sequelize) {
    return this.execute(queryInterface, Sequelize, migrationCommands);
  },
  down: function (queryInterface, Sequelize) {
    return this.execute(queryInterface, Sequelize, rollbackCommands);
  },
  info: info
};
