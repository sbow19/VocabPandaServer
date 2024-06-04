"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: "debug",
    format: winston_1.default.format.simple(),
    transports: [
        new winston_1.default.transports.File({ filename: "./src/shared/log/error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "./src/shared/log/info.log", level: "info" }),
        new winston_1.default.transports.Console()
    ],
    exitOnError: false
});
exports.default = logger;
//# sourceMappingURL=logger.js.map