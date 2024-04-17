const schedule = require("node-schedule");
import RefreshCounter from "@shared/updates/refresh/refresh";

class CronClass {

    constructor(){

    }

    static runCronJobs(){
        
        schedule.scheduleJob("* * * * *", function(){
            RefreshCounter.gameRefreshChecker()
        });

        schedule.scheduleJob("* * * * *", function (){
            RefreshCounter.translationsRefreshChecker()
        });

        schedule.scheduleJob("* * * * *", function(){
            RefreshCounter.premiumUserChecker()
        });
    };


}

export default CronClass;