module.exports = (db) => {
  db.Retip.belongsTo(db.Tip, { foreignKey: 'tipId' });
  db.Tip.hasMany(db.Retip, { foreignKey: 'tipId' });

}
