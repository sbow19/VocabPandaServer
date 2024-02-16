"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule = require("node-schedule");
const refresh_1 = __importDefault(require("@shared/updates/refresh/refresh"));
class CronClass {
    constructor() {
    }
    static runCronJobs() {
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.gameRefreshChecker();
        });
        schedule.scheduleJob("* * * * *", function () {
            refresh_1.default.translationsRefreshChecker();
        });
        schedule.scheduleJob("* * * * *", function () { refresh_1.default.premiumUserChecker(); });
    }
    ;
}
exports.default = CronClass;
//# sourceMappingURL=cron.js.map