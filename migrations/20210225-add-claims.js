'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Claims", deps: []
 * addIndex "claims_contract_id_url" to table "Claims"
 *
 **/

var info = {
    "revision": 15,
    "name": "add-claims",
    "created": "2021-02-26T16:16:39.630Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "Claims",
                {
                    "contractId": {
                        "type": Sequelize.STRING,
                        "field": "contractId",
                        "allowNull": false,
                        "primaryKey": true
                    },
                    "url": {
                        "type": Sequelize.TEXT,
                        "field": "url",
                        "allowNull": false,
                        "primaryKey": true
                    },
                    "amount": {
                        "type": Sequelize.DECIMAL,
                        "field": "amount",
                        "allowNull": false
                    },
                    "claimGen": {
                        "type": Sequelize.INTEGER,
                        "field": "claimGen",
                        "allowNull": false
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
        },
        {
            fn: "addIndex",
            params: [
                "Claims",
                ["contractId", "url"],
                {
                    "indexName": "claims_contract_id_url",
                    "name": "claims_contract_id_url",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
        fn: "dropTable",
        params: ["Claims", {
            transaction: transaction
        }]
    }];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
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
    up: async function(queryInterface, Sequelize)
    {
      await this.execute(queryInterface, Sequelize, migrationCommands);

      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('CREATE FUNCTION unclaimed(numeric, text, varchar) RETURNS boolean AS \'SELECT "claimGen" < $1 FROM "Claims" AS "Claim" WHERE "Claim"."url" = $2 AND "Claim"."contractId" = $3\' LANGUAGE SQL STABLE;', { transaction });
      await queryInterface.sequelize.query('CREATE FUNCTION unclaimed_amount(numeric, text, varchar, numeric) RETURNS numeric AS \'SELECT CASE WHEN unclaimed($1, $2, $3) THEN COALESCE($4, 0) ELSE 0 END\' LANGUAGE SQL STABLE;', { transaction });
      await queryInterface.sequelize.query('CREATE FUNCTION claimed_amount(numeric, text, varchar, numeric) RETURNS numeric AS \'SELECT CASE WHEN unclaimed($1, $2, $3) THEN 0 ELSE COALESCE($4, 0) END\' LANGUAGE SQL STABLE;', { transaction });
      return transaction.commit();
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP FUNCTION claimed_amount(numeric, text, varchar, numeric);', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION unclaimed_amount(numeric, text, varchar, numeric);', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION unclaimed(numeric, text, varchar);', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
