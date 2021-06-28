const { ErrorReport } = require('../../../models');

const ErrorReportLogic = {
  async addItem({
    appVersion, browser, error, time, platform, description,
  }) {
    return ErrorReport.create({
      appVersion,
      browser,
      error,
      time,
      platform,
      description,
    });
  },

  async getAllReports() {
    return ErrorReport.findAll({ raw: true });
  },
};

module.exports = ErrorReportLogic;
