import UserDetailsDatabase from "@shared/models/user_details/user_details_db";
import * as appTypes from "@appTypes/appTypes"

class RefreshCounter {

    constructor(){

    };

    static gameRefreshChecker(): Promise<appTypes.refreshErrorResponse>{

        return new Promise(async(resolve, reject)=>{

            const refreshErrorResponse: appTypes.refreshErrorResponse = {
                responseMessage: "Refresh unsuccessful",
                info: ""
            };
    
            try{

                //Get db connection

                let  dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                await dbConnectionObject.mysqlConnection?.beginTransaction(err=>{throw err});

                const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const checkGameRefreshSqlQuery = 'SELECT * FROM next_plays_refresh WHERE game_refresh < ?;'

                let [queryResults] = await dbConnectionObject.mysqlConnection?.query(checkGameRefreshSqlQuery, currentTime)
                

                if (queryResults.length > 0) {

                    //Update next refresh timer

                    for(let user of queryResults){

                        const updateGameRefreshSqlQuery = `
                            UPDATE next_plays_refresh
                            SET next game_refresh = NULL
                            WHERE user_id = ?
                        `
                        await dbConnectionObject.mysqlConnection?.query(updateGameRefreshSqlQuery, user.user_id)
                    }

                    //Update plays left table

                    for(let user of queryResults){

                        const updateGameRefreshSqlQuery = `
                            UPDATE plays_left
                            SET next plays_left = 10
                            WHERE user_id = ?
                        `
                        await dbConnectionObject.mysqlConnection?.query(updateGameRefreshSqlQuery, user.user_id)

                    }

                    await dbConnectionObject.mysqlConnection?.commit();
                    
        
                    console.log('Updating game refreshes in database...');

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = queryResults

                    resolve(refreshErrorResponse);

                } else if (queryResults.length === 0){

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = "No game entries refreshed"

                    console.log('No matches found at', currentTime);

                    resolve(refreshErrorResponse)

                    
                }
    
            }catch(e){
    
                refreshErrorResponse.info = e
                refreshErrorResponse.responseMessage = "Refresh unsuccessful"
    
                reject(refreshErrorResponse)
            }

        })

    };

    static translationsRefreshChecker():  Promise<appTypes.refreshErrorResponse>{

        return new Promise(async(resolve, reject)=>{

            const refreshErrorResponse: appTypes.refreshErrorResponse = {
                responseMessage: "Refresh unsuccessful",
                info: ""
            };
    
            try{

                //Get db connection

                let  dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                await dbConnectionObject.mysqlConnection?.beginTransaction(err=>{throw err});

                const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const checkTranslationsRefreshSqlQuery = 'SELECT * FROM next_translations_refresh WHERE translations_refresh < ?;'

                let [queryResults] = await dbConnectionObject.mysqlConnection?.query(checkTranslationsRefreshSqlQuery, currentTime)
                

                if (queryResults.length > 0) {

                    //Update refresh timer

                    for(let user of queryResults){

                        const updateTranslationSqlQuery = `
                            UPDATE next_translations_refresh
                            SET translations_refresh = NULL
                            WHERE user_id = ?
                            ;
                        `
                        await dbConnectionObject.mysqlConnection?.query(updateTranslationSqlQuery, user.user_id)
                    }

                    //Update translations left

                    for(let user of queryResults){

                        //Check if user is premium or not

                        const checkPremium = `SELECT * FROM user_details WHERE user_id = ?;`

                        const [premiumQueryResult] = await dbConnectionObject.mysqlConnection.query(
                            checkPremium,
                            user.user_id
                        );

                        if(premiumQueryResult[0].premium){
                            const updateGameRefreshSqlQuery = `
                            UPDATE translation_left
                            SET translations_left = 120
                            WHERE user_id = ?
                            ;
                        `
                            await dbConnectionObject.mysqlConnection?.query(updateGameRefreshSqlQuery, user.user_id)

                        } else if (!premiumQueryResult[0].premium){

                            const updateGameRefreshSqlQuery = `
                            UPDATE translation_left
                            SET translations_left = 40
                            WHERE user_id = ?
                            ;
                            `
                            await dbConnectionObject.mysqlConnection?.query(updateGameRefreshSqlQuery, user.user_id)
                        }
                    };

                    await dbConnectionObject.mysqlConnection?.commit();
                    
        
                    console.log('Updating translations in database...');

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = queryResults

                    resolve(refreshErrorResponse);
                } else if (queryResults.length === 0){

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = "No translation entries refreshed"

                    resolve(refreshErrorResponse)

                    console.log('No translation entry updates required at', currentTime);
                }
    
            }catch(e){
    
                refreshErrorResponse.info = e
                refreshErrorResponse.responseMessage = "Refresh unsuccessful"
    
                reject(refreshErrorResponse)
            }

        })


    };

    static premiumUserChecker():  Promise<appTypes.refreshErrorResponse>{

        return new Promise(async(resolve, reject)=>{

            const refreshErrorResponse: appTypes.refreshErrorResponse = {
                responseMessage: "Refresh unsuccessful",
                info: ""
            };
    
            try{

                //Get db connection


                let  dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                await dbConnectionObject.mysqlConnection?.beginTransaction(err=>{throw err});

                const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const checkPremiumSqlQuery = 'SELECT * FROM premium_users WHERE membership_end < ?;'

                let [queryResults] = await dbConnectionObject.mysqlConnection?.query(checkPremiumSqlQuery, currentTime)
                

                if (queryResults.length > 0) {

                    //Update membership end

                    for(let user of queryResults){

                        const updatePremiumSqlQuery = `
                            DELETE FROM premium_users
                            WHERE user_id = ?
                            ;
                        `
                        await dbConnectionObject.mysqlConnection?.query(updatePremiumSqlQuery, user.user_id);

                    }

                    //Update plays left table

                    for(let user of queryResults){

                        const updateGameRefreshSqlQuery = `
                            UPDATE plays_left
                            SET plays_left = 10
                            WHERE user_id = ?
                            ;
                        `
                        await dbConnectionObject.mysqlConnection?.query(updateGameRefreshSqlQuery, user.user_id)

                        
                    }

                    //update translations left

                    for(let user of queryResults){

                        const updateTranslationRefreshSqlQuery = `
                            UPDATE translation_left
                            SET translations_left = 40
                            WHERE user_id = ?
                            ;
                        `
                        await dbConnectionObject.mysqlConnection?.query(updateTranslationRefreshSqlQuery, user.user_id)
                    }

                    await dbConnectionObject.mysqlConnection?.commit();
                    
        
                    console.log('Updating premium profiles in database...');

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = queryResults

                    resolve(refreshErrorResponse);

                } else if (queryResults.length === 0){

                    refreshErrorResponse.responseMessage = "Refresh complete"
                    refreshErrorResponse.info = "No premium profiles refreshed"

                    resolve(refreshErrorResponse)

                    console.log('No premium profile updates required at', currentTime);
                }
    
            }catch(e){
    
                refreshErrorResponse.info = e
                refreshErrorResponse.responseMessage = "Refresh unsuccessful"
    
                reject(refreshErrorResponse)
            }

        })


    };
    


};

export default RefreshCounter;