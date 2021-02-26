module.exports = (db, sequelize, Op) => {
  db.Retip.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Retip, { foreignKey: 'tipId' });

  db.Comment.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Comment, { foreignKey: 'tipId' });

  db.LinkPreview.hasOne(db.Tip, { optional: true, sourceKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  db.Tip.belongsTo(db.LinkPreview, { optional: true, targetKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })

  db.Tip.hasOne(db.Claim, {
    foreignKey: 'url',
    sourceKey: 'url',
    scope: {
      [Op.and]: sequelize.where(sequelize.col("Tip.contractId"),
        Op.eq,
        sequelize.col("Claim.contractId")),
    },
    constraints: false,
  });

}
