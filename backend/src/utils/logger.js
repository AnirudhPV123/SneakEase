import { developmentLogger } from '../config/developmentLogger.config.js';
import { productionLogger } from '../config/productionLogger.config.js';

let logger = null;

console.log('here');
if (process.env.NODE_ENV === 'development') {
  logger = developmentLogger();
}

if (process.env.NODE_ENV === 'production') {
  logger = productionLogger();
}

export { logger };
