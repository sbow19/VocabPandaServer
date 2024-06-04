"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule = require("node-schedule");
const refresh_1 = __importDefault(require("@shared/cron/refresh/refresh"));
const email_verification_1 = __importDefault(require("./email/email_verification"));
const logger_1 = __importDefault(require("@shared/log/logger"));
class CronClass {
    static runCronJobs() {
        //Check refresh counters
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.playsRefreshChecker()
                .then(log => {
                logger_1.default.info(JSON.stringify(log));
            })
                .catch(error => {
                logger_1.default.error(JSON.stringify(error));
            });
        });
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.translationsRefreshChecker()
                .then(log => {
                logger_1.default.info(JSON.stringify(log));
            })
                .catch(error => {
                logger_1.default.error(JSON.stringify(error));
            });
        });
        schedule.scheduleJob("*/30 * * * *", function () {
            refresh_1.default.premiumUserChecker()
                .then(log => {
                logger_1.default.info(JSON.stringify(log));
            })
                .catch(error => {
                logger_1.default.error(JSON.stringify(error));
            });
        });
        //Check email verification list
        schedule.scheduleJob("* * * *", function () {
            email_verification_1.default.CheckUnverifiedEmails()
                .then(log => {
                logger_1.default.info(JSON.stringify(log));
            })
                .catch((error) => {
                logger_1.default.error(JSON.stringify(error));
            });
        });
    }
    ;
}
exports.default = CronClass;
//# sourceMappingURL=cron.js.map