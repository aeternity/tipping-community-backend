module.exports = (db, sequelize, Op) => {
  db.Retip.belongsTo(db.Tip, { as: 'tip', foreignKey: 'tipId' });
  db.Tip.hasMany(db.Retip, { as: 'retips', foreignKey: 'tipId' });

  db.Comment.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Comment, { foreignKey: 'tipId' });

  db.LinkPreview.hasOne(db.Tip, {
    as: 'tip', optional: true, sourceKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION',
  });
  db.Tip.belongsTo(db.LinkPreview, {
    as: 'linkPreview', optional: true, targetKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION',
  });

  db.BlacklistEntry.belongsTo(db.Tip, { foreignKey: 'tipId', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
  db.Tip.hasMany(db.BlacklistEntry, { foreignKey: 'tipId', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });

  db.Tip.hasOne(db.Claim, {
    as: 'claim',
    foreignKey: 'url',
    sourceKey: 'url',
    scope: {
      [Op.and]: sequelize.where(sequelize.col('Tip.contractId'),
        Op.eq,
        sequelize.col('claim.contractId')),
    },
    constraints: false,
  });

  db.Tip.hasOne(db.ChainName, {
    as: 'chainName', sourceKey: 'sender', foreignKey: 'publicKey', constraints: false, optional: true,
  });
};
