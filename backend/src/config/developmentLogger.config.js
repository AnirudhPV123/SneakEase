import { createLogger, format, transports } from "winston"
import {combine, timestamp, label, printf } from format


const myFormat = printf(({ level, message, timestamp }) => {
  return `${level} ${timestamp} ${message}`;
});

const developmentLogger = () => {
  return createLogger({
    format: combine(format.colorize(), timestamp({format:"HH:mm:ss"}), myFormat),
    transports: [new transports.File({ filename: 'siteErrors.log' }), new transports.Console()],
  });
};

export { developmentLogger };
