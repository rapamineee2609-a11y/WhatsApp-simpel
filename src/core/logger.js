import winston from 'winston';
import chalk from 'chalk';
import moment from 'moment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const time = moment(timestamp).format('HH:mm:ss');
  const levelColor = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.blue,
    debug: chalk.gray,
    success: chalk.green
  };
  
  const color = levelColor[level] || chalk.white;
  const levelStr = level.toUpperCase().padEnd(7);
  
  let log = `${chalk.gray(time)} ${color(levelStr)} ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += `\n${chalk.gray(JSON.stringify(meta, null, 2))}`;
  }
  
  return log;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Custom levels
logger.success = (message, meta) => logger.log('success', message, meta);
logger.error = (message, meta) => logger.log('error', message, meta);
logger.warn = (message, meta) => logger.log('warn', message, meta);
logger.info = (message, meta) => logger.log('info', message, meta);
logger.debug = (message, meta) => logger.log('debug', message, meta);

export default logger;
