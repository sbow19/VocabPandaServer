"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule = require("node-schedule");
const refresh_1 = __importDefault(require("@shared/cron/refresh/refresh"));
const email_verification_1 = __importDefault(require("./email/email_verification"));
class CronClass {
    static runCronJobs() {
        //Check refresh counters
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.playsRefreshChecker()
                .then(log => {
                //Record log of changes in database
                CronClass.#recordChangesLog(log, "Plays refresh check");
            })
                .catch(error => {
                CronClass.#recordErrorsLog(error, "Plays refresh check");
                //Record error log.
            });
        });
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.translationsRefreshChecker()
                .then(log => {
                //Record log of changes in database
                CronClass.#recordChangesLog(log, "Translation refresh check");
            })
                .catch(error => {
                CronClass.#recordErrorsLog(error, "Translation refresh check");
                //Record error log.
            });
        });
        schedule.scheduleJob("*/30 * * * *", function () {
            refresh_1.default.premiumUserChecker()
                .then(log => {
                //Record log of changes in database
                CronClass.#recordChangesLog(log, "Premium check");
            })
                .catch(error => {
                CronClass.#recordErrorsLog(error, "Premium check");
                //Record error log.
            });
        });
        //Check email verification list
        schedule.scheduleJob("* * * *", function () {
            email_verification_1.default.CheckUnverifiedEmails()
                .then(log => {
                //TODO: send ping to device to delete login details
                //Schedule ping for when the device is next talking to the backend. 
                //Record log of changes in database
                CronClass.#recordChangesLog(log, "email verification check");
            })
                .catch((error) => {
                CronClass.#recordErrorsLog(error, "email verification check");
                //Record error log.
            });
        });
    }
    ;
    static #recordChangesLog(log, changeType) {
        console.log(log, changeType);
        return;
    }
    static #recordErrorsLog(error, errorType) {
        console.log(error.stack, error.message);
        return;
    }
}
exports.default = CronClass;
//# sourceMappingURL=cron.js.map