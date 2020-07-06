const fs = require('fs');
const path = require('path');

module.exports = class LoggerLogic {
  static async showLogs(req, res) {
    const logFolder = path.resolve('./logs/');
    const logFiles = await fs.readdirSync(logFolder);
    const selectedLogFiles = logFiles.slice(logFiles.length - 7);
    const logLines = selectedLogFiles
      .reduce((allLogs, file) => [
        ...allLogs,
        ...fs.readFileSync(`${logFolder}/${file}`, 'utf-8')
          .split('\n')
          .map((line) => (line ? JSON.parse(line) : null)),
      ], [])
      .filter((line) => !!line)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.send(logLines);
  }
};
