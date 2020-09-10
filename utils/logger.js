const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const enumerateErrorFormat = winston.format(info => {
  if (info.message instanceof Error) {
    // eslint-disable-next-line no-param-reassign
    info.message = {
      message: info.message.message,
      stack: info.message.stack,
      ...info.message,
    };
  }

  if (info instanceof Error) {
    return {
      message: info.message,
      stack: info.stack,
      ...info,
    };
  }

  return info;
});

const logger = module => {
  const fileName = path.basename(module.id, '.js');
  return winston.createLogger({
    format: winston.format.combine(
      enumerateErrorFormat(),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(msg => {
        const splatMsg = msg[Symbol.for('splat')] ? msg[Symbol.for('splat')].join(' ') : '';
        // ALL LOGS
        if (msg[Symbol.for('level')] !== 'error') return `[${msg.timestamp}] (${fileName}) ${msg.level}: ${msg.message} ${splatMsg} `;
        // ONLY ERROR
        const prefix = `[${msg.timestamp}] (${fileName}) ${msg.level}:`;
        const logs = [];
        // SEQUELIZE ERRORS
        if (msg.sql) {
          logs.push(`${msg.name} (${msg.original.message}) ${splatMsg} `);
          logs.push(`${msg.original.detail} ${splatMsg} `);
        } else if (msg.stack) {
          // NORMAL ERROR
          logs.push(msg.message);
          logs.push(...msg.stack.split('\n').reduce((acc, curr) => {
            if (acc[acc.length - 1] !== curr) acc.push(curr);
            return acc;
          }, []));
        } else {
          // CUSTOM ERROR MESSAGE
          logs.push(msg.message);
        }

        return logs.map(line => `${prefix} ${line}`).join('\n');
      }),
    ),
    transports: [
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      }),
      new (winston.transports.DailyRotateFile)({
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
      }),
      new winston.transports.File({
        filename: './logs/errors.log',
        level: 'error',
      }),
    ],
  });
};

module.exports = logger;
