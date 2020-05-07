const { ErrorReport } = require('../models');

module.exports = class ErrorReportLogic {

  static async addItem (req, res) {
    try {
      const { appVersion, browser, error, time, platform } = req.body;
      const entry = await ErrorReport.create({ appVersion, browser: JSON.stringify(browser), error: JSON.stringify(error), time, platform });
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
