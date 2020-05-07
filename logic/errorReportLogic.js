const { ErrorReport } = require('../models');

module.exports = class ErrorReportLogic {

  static async addItem (req, res) {
    try {
      const { appVersion, browser, error, time, type } = req.body;
      const entry = await ErrorReport.create({ appVersion, browser: JSON.stringify(browser), error, time, type });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async getAllItems (req, res) {
    res.send(await ErrorReport.findAll({ raw: true }));
  }
};
