const morgan = require("morgan");
const logger = require("./logger");

// Create a Morgan stream that writes to LoggerInfo
const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Create Morgan middleware
const morganMiddleware = morgan(
  `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms`,
  { stream },
);

module.exports = morganMiddleware;
