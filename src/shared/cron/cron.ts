const schedule = require("node-schedule");
import RefreshCounter from "@shared/cron/refresh/refresh";
import EmailVerificationChecker from "./email/email_verification";
import logger from "@shared/log/logger";

class CronClass {

    static runCronJobs(){


        //Check refresh counters
        schedule.scheduleJob("* * * * *", function(){
            RefreshCounter.playsRefreshChecker()
            .then(log=>{

                logger.info(
                    JSON.stringify(log)
                )
                
            })
            .catch(error=>{

                logger.error(
                    JSON.stringify(error)
                )

            
            })
        });

        schedule.scheduleJob("* * * * *", function (){
            RefreshCounter.translationsRefreshChecker()
            .then(log=>{

                logger.info(
                    JSON.stringify(log)
                )

               
            })
            .catch(error=>{

                logger.error(
                    JSON.stringify(error)
                )

            })
        });

        schedule.scheduleJob("*/30 * * * *", function(){
            RefreshCounter.premiumUserChecker()
            .then(log=>{

                logger.info(
                    JSON.stringify(log)
                )

        
            })
            .catch(error=>{

                logger.error(
                    JSON.stringify(error)
                )


                
            })
        });

        //Check email verification list
        schedule.scheduleJob("* * * *", function(){
            EmailVerificationChecker.CheckUnverifiedEmails()
            .then(log=>{

                logger.info(
                    JSON.stringify(log)
                )

                
            })
            .catch((error: Error)=>{

                logger.error(
                    JSON.stringify(error)
                )
            })
        })
    };


}

export default CronClass;