const { ErrorReport } = require('../../../models');

module.exports = class ErrorReportLogic {
  static async addItem(req, res) {
    try {
      const {
        appVersion, browser, error, time, platform, description,
      } = req.body;
      const entry = await ErrorReport.create({
        appVersion,
        browser: JSON.stringify(browser),
        error: JSON.stringify(error),
        time,
        platform,
        description,
      });
      res.send(entry);
    } catch (e) {
      res.status(500).send(e.message);
    }
  }

  static async getAllItems(req, res) {
    res.send(await ErrorReport.findAll({ raw: true }));
  }
};
