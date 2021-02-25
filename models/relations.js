module.exports = (db) => {
  db.Retip.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Retip, { foreignKey: 'tipId' });

  db.Comment.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Comment, { foreignKey: 'tipId' });

  db.LinkPreview.hasOne(db.Tip, { optional: true, sourceKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  db.Tip.belongsTo(db.LinkPreview, { optional: true, targetKey: 'requestUrl', foreignKey: 'url', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })

}
