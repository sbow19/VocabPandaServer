const schedule = require("node-schedule");
import RefreshCounter from "@shared/cron/refresh/refresh";
import EmailVerificationChecker from "./email/email_verification";

class CronClass {

    static runCronJobs(){

        //Check refresh counters
        schedule.scheduleJob("* * * * *", function(){
            RefreshCounter.playsRefreshChecker()
            .then(log=>{

                //Record log of changes in database
                CronClass.#recordChangesLog(log, "Plays refresh check");
            })
            .catch(error=>{

                CronClass.#recordErrorsLog(error, "Plays refresh check");

                //Record error log.
            })
        });

        schedule.scheduleJob("* * * * *", function (){
            RefreshCounter.translationsRefreshChecker()
            .then(log=>{

                //Record log of changes in database

                CronClass.#recordChangesLog(log, "Translation refresh check");
            })
            .catch(error=>{

                CronClass.#recordErrorsLog(error, "Translation refresh check");

                //Record error log.
            })
        });

        schedule.scheduleJob("* * * * *", function(){
            RefreshCounter.premiumUserChecker()
            .then(log=>{

                //Record log of changes in database
                CronClass.#recordChangesLog(log, "Premium check");
            })
            .catch(error=>{

                CronClass.#recordErrorsLog(error, "Premium check");
                //Record error log.
            })
        });

        //Check email verification list
        schedule.scheduleJob("* * * *", function(){
            EmailVerificationChecker.CheckUnverifiedEmails()
            .then(log=>{

                //TODO: send ping to device to delete login details
                //Schedule ping for when the device is next talking to the backend. 

                //Record log of changes in database

                CronClass.#recordChangesLog(log, "email verification check");
            })
            .catch((error: Error)=>{

                CronClass.#recordErrorsLog(error, "email verification check");

                //Record error log.
            })
        })
    };

    static #recordChangesLog(log, changeType){

        console.log(log, changeType)
        return
    }

    static #recordErrorsLog(error: Error, errorType){
        console.log(error.stack, error.message);
        return
    }


}

export default CronClass;