import models from "../../../models/index.js";

const { ErrorReport } = models;
const ErrorReportLogic = {
  async addItem({ appVersion, browser, error, time, platform, description }) {
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
export default ErrorReportLogic;
