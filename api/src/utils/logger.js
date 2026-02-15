import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    isDevelopment ? devFormat : json()
  ),
  defaultMeta: { service: 'openclaw-dashboard' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        isDevelopment ? devFormat : json()
      )
    })
  ]
});

// Add file transport in production
if (!isDevelopment) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}