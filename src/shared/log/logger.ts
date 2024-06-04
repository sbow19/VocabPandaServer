import winston from "winston";

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: "./src/shared/log/error.log", level: "error" }),
        new winston.transports.File({ filename: "./src/shared/log/info.log", level: "info" }),
        new winston.transports.Console()
    ],
    exitOnError: false
});

export default logger;
