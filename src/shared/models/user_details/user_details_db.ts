import * as appTypes from "@appTypes/appTypes"
import vpModel from "@shared/models/models_template";
const strftime = require('strftime');
const UserDetailsDBPool = require("./user_details_pool");
import preparedSQLStatements from "../prepared_statements";

class UserDetailsDatabase extends vpModel {

    //Add new user details
    static addNewUserDetails(userCredentials: appTypes.UserCredentials, userId: string): Promise<appTypes.APIAccountOperationResponse>{

        return new Promise(async(resolve, reject)=>{

            const addUserDetailsResponse: appTypes.APIAccountOperationResponse = {
                success: false,
                operationType: "create",
                accountOperation: "create account",
                contentType: "account",
                userId: userId,
                message: "operation unsuccessful"
            }

            const sqlFormattedDate = super.getCurrentTime();

            try{

                const connectionResponseObject = await super.getUsersDetailsDBConnection(); //Get connection to user_logins table

                try{

                    //Begin transaction
                    await connectionResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.addUserDetails,
                        [
                            userCredentials.username,
                            userId,
                            sqlFormattedDate,
                            0
                        ])
         

                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.addDefaultSettings,
                        [
                            userId, //User id 
                            0, // timer set to false
                            10, //default no of turns in one flashcard play
                            "EN", //default target language is English
                            "EN", //default output language is English
                            "",  //No default project set yet. 
                        ])
                    
                    //Add x plays/ translations left and refresh times

                    await connectionResponseObject.mysqlConnection?.query(preparedSQLStatements.accountStatements.addDefaultNextPlaysRefresh, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(preparedSQLStatements.accountStatements.addDefaultNextTranslationsRefresh, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(preparedSQLStatements.accountStatements.addDefaultPlaysLeft, [userId, 10]);
                    await connectionResponseObject.mysqlConnection?.query(preparedSQLStatements.accountStatements.addDefaultTranslationsLeft, [userId, 100]);
            

                    await connectionResponseObject.mysqlConnection?.commit(); // commit add new user transaction        

                    addUserDetailsResponse.message = "operation successful"
                    addUserDetailsResponse.success = true

                    resolve(addUserDetailsResponse)

                }catch(e){
                    throw e
                }finally{

                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }

            }catch(e){

                console.log(e);

                //If there is some error...
                addUserDetailsResponse.error = e;
                reject(addUserDetailsResponse);
            }
        })
    };

    //Update user settings

    static updateUserSettings = (settingsObject: appTypes.UserSettings): Promise<appTypes.APIOperationResponse>=>{
        return new Promise(async(resolve, reject)=>{

            const settingsUpdateResponse: appTypes.APIOperationResponse = {

                success: false,
                message: "operation unsuccessful",
                operationType: "update",
                contentType: "settings"
            };

            try{

                //Get db connection

                const dbResponseObject = await super.getUsersDetailsDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                   

                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.settingsStatements.updateUserSettings,
                        [
                            settingsObject.gameTimerOn,
                            settingsObject.gameNoOfTurns,
                            settingsObject.defaultTargetLanguage,
                            settingsObject.defaultOutputLanguage,
                            settingsObject.defaultProject,
                            settingsObject.userId
                        ])
                    
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    if(queryResponse.affectedRows === 0){

                        settingsUpdateResponse.message = "operation unsuccessful";

                        reject(settingsUpdateResponse);

                    } else if (queryResponse.affectedRows > 0){

                        settingsUpdateResponse.message ="operation successful";
                        settingsUpdateResponse.success = true;

                        resolve(settingsUpdateResponse)
                    }

                }catch(e){
                    throw e
                }finally{
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){
                console.log(e, "update user settings error")
                settingsUpdateResponse.message = "operation unsuccessful"
                reject(settingsUpdateResponse);

            }
        })
    }

    static getUserSettings = (userId: string): Promise<appTypes.APIOperationResponse<appTypes.UserSettings>>=>{
        return new Promise(async(resolve, reject)=>{

            const fetchResult: appTypes.APIOperationResponse<appTypes.UserSettings> = {
                operationType: "get",
                message: "operation unsuccessful",
                success: false,
                contentType: "settings"
            }

            try{

                //Get db connection

                const dbResponseObject = await super.getUsersDetailsDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                   
                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.settingsStatements.getUserSettings,
                        [
                            userId
                        ]
                    )
                    
                    await dbResponseObject.mysqlConnection?.commit(); 
                    
                    if(queryResponse.affectedRows === 0){
                        //No user settings identified for this user

                        fetchResult.message = "operation unsuccessful";
                        reject(fetchResult);

                    } else if (queryResponse.affectedRows === 1){

                        const userSettings = queryResponse[0];

                        fetchResult.message ="operation successful";
                        fetchResult.success = true;
                        fetchResult.customResponse?.defaultOutputLanguage = userSettings["output_lang"];
                        fetchResult.customResponse?.defaultProject = userSettings["default_project"];
                        fetchResult.customResponse?.defaultTargetLanguage = userSettings["target_lang"];
                        fetchResult.customResponse?.gameNoOfTurns = userSettings["slider_val"];
                        fetchResult.customResponse?.gameTimerOn = userSettings["timer_on"]; 

                        resolve(fetchResult)
                    }

                }catch(e){
                    throw e
                }finally{
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){
                console.log(e, "Fetch user settings error")
                fetchResult.message = "operation unsuccessful"
                reject(fetchResult);

            }
        })
    }


    //Ugrade user to premium
    
    static upgradeToPremium(username: string): Promise<appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig>>{
        return new Promise(async(resolve, reject)=>{

            const dbUpdateResponseObject: appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig> = {
                responseCode: 0,
                responseMessage: "upgrade unsuccessful",
                updateMessage: ""
            }
            try{

                const dbResponseObject = await super.getUsersDetailsDBConnection();

                if(dbResponseObject.responseMessage === "Connection unsuccessful"){
                    reject(dbUpdateResponseObject);
                    return
                };

                try{

                    //start db transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err})

                    //Get user Id
                    const {matchMessage} = await super.getUserId(username);  //retrieves userId from response object

                    const userId = matchMessage

                    //upgrade user in user details database

                    const upgradeSqlStatement = `

                    UPDATE user_details
                    SET premium = 1
                    WHERE username = ?;
                    `

                    const updateResult = await dbResponseObject.mysqlConnection.query(
                        upgradeSqlStatement,
                        username
                    );


                    //Add details to user_details.premium_users

                    const membershipEndTime = super.getMembershipEndTime();

                    const savePremiumInfoSql = `INSERT INTO premium_users VALUES(?, ?, ?);`  //user_id,  username, membership_end

                    await dbResponseObject.mysqlConnection?.query(
                        savePremiumInfoSql,
                        [
                            userId,
                            username,
                            membershipEndTime
                        ]
                    )

                    //Update x games and refresh times

                    const nextPlaysSqlQuery =  `UPDATE next_plays_refresh SET game_refresh = ? WHERE user_id = ?;` //user_id, game_refresh
                    const nextTranslationsSqlQuery =  `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;` //user_id, translations_refresh
                    const playLeftSqlQuery =  `UPDATE plays_left SET plays_left = ? WHERE user_id = ?;` //user_id, plays_left
                    const translationsLeftSqlQuery =  `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;` //user_id, translation_left


                    await dbResponseObject.mysqlConnection.query(nextPlaysSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(nextTranslationsSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(playLeftSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(translationsLeftSqlQuery, [120, userId]);

                    //Commit db transaction 
                    dbResponseObject.mysqlConnection?.commit();

                    //Configure response object on success
                    dbUpdateResponseObject.responseMessage = "Upgrade successful"
                    
                    resolve(dbUpdateResponseObject);


                }catch(e){
                    throw e
                }finally{

                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

                
            }catch(e){

                console.log(e)
                reject(dbUpdateResponseObject)
            }

        })
    }

    //downgrade user from premium

    static downgradeToFree(username: string): Promise<appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig>>{
        return new Promise(async(resolve, reject)=>{

            const dbUpdateResponseObject: appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig> = {
                responseCode: 0,
                responseMessage: "Downgrade unsuccessful",
                updateMessage: ""
            }
            try{

                const dbResponseObject = await super.getUsersDetailsDBConnection();

                if(dbResponseObject.responseMessage === "Connection unsuccessful"){
                    reject(dbUpdateResponseObject);
                    return
                }

                try{

                     //Start transaction 
                    dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //upgrade user in user details database

                    const downgradeSqlStatement = `

                    UPDATE user_details
                    SET premium = 0
                    WHERE username = ?;
                    `

                    const downgradeResult = await dbResponseObject.mysqlConnection.query(
                        downgradeSqlStatement,
                        username
                    );


                    //Get user Id
                    const {matchMessage} = await super.getUserId(username);  //retrieves userId from response object

                    const userId = matchMessage;

                    //Remove details to user_details.premium_users
                    const removePremiumInfoSql = `DELETE FROM premium_users WHERE user_id = ?;`  //user_id

                    await dbResponseObject.mysqlConnection?.query(removePremiumInfoSql, userId);

                    //Update x games and refresh times
                    const nextPlaysSqlQuery =  `UPDATE next_plays_refresh SET game_refresh = ? WHERE user_id = ?;` //user_id, game_refresh
                    const nextTranslationsSqlQuery =  `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;` //user_id, translations_refresh
                    const playLeftSqlQuery =  `UPDATE plays_left SET plays_left = ? WHERE user_id = ?;` //user_id, plays_left
                    const translationsLeftSqlQuery =  `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;` //user_id, translation_left


                    await dbResponseObject.mysqlConnection.query(nextPlaysSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(nextTranslationsSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(playLeftSqlQuery, [10, userId]);
                    await dbResponseObject.mysqlConnection.query(translationsLeftSqlQuery, [40, userId]);

                    //Commit db transaction 

                    dbResponseObject.mysqlConnection?.commit()

                    //Configure response object on success

                    dbUpdateResponseObject.responseMessage = "Downgrade successful";
                    
                    resolve(dbUpdateResponseObject);

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
               

            }catch(e){

                console.log(e);
                reject(dbUpdateResponseObject);
            }

        })
    }

    //Get user premium status
    static checkPremiumStatus = (userId: string): Promise<boolean> =>{
        return new Promise(async(resolve, reject)=>{

            const fetchResult: appTypes.APIOperationResponse<boolean> = {
                success: false,
                message: "operation unsuccessful",
                contentType: "account",
                operationType: "get",
                customResponse: false
            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersDetailsDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.checkPremiumStatus,
                        [
                            userId
                        ])
                    
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    if(queryResponse.affectedRows === 0){
                        //No user found 
                        reject(fetchResult);

                    } else if (queryResponse.affectedRows > 0){
                        //User found

                        let premium: boolean;
                        if(queryResponse[0].premium === 1){
                            premium = true;
                        }else if(queryResponse[0].premium === 0){
                            premium = false
                        }

                        fetchResult.message ="operation successful";
                        fetchResult.success = true;
                        fetchResult.customResponse = premium;

                        resolve(premium);
                    }

                }catch(e){
                    throw e
                }finally{
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){
                console.log(e, "update user settings error")
                fetchResult.message = "operation unsuccessful"
                reject(fetchResult);

            }

        })
    }

    //Update last logged in
    static updateLastLoggedIn(username: string): Promise<appTypes.DBUpdateResponseObject<appTypes.DBUpdateResponseConfig>>{
        return new Promise(async(resolve, reject)=>{

            const dbUpdateResponseObject: appTypes.DBUpdateResponseObject<appTypes.DBUpdateResponseConfig> = {
                responseCode: 0,
                responseMessage: "Update unsuccessful",
                updateMessage: ""
            }

            const sqlFormattedDate = super.getCurrentTime();

            try{

                const dbResponseObject = await super.getUsersDetailsDBConnection();

                if(dbResponseObject.responseMessage === "Connection unsuccessful"){
                    reject(dbUpdateResponseObject);
                    return
                }

                try{

                    dbResponseObject.mysqlConnection?.beginTransaction(err =>{throw err});

                    try{
                        const updateLoggedInSqlStatement = `

                        UPDATE user_details
                        SET last_logged_in = ?
                        WHERE username = ?
                        ;
                        `

                        const [updateResultUsername]  = await dbResponseObject.mysqlConnection.query(
                            updateLoggedInSqlStatement,
                            [
                                sqlFormattedDate,
                                username
                            ]
                        );

                        console.log(updateResultUsername, "update result by user")

                        if(updateResultUsername.affectedRows === 0){
                            throw false
                        } else if (updateResultUsername.affectedRows === 1){
                            dbUpdateResponseObject.responseMessage = "Update successful"
                            resolve(dbUpdateResponseObject);
                        };

                    }catch(e){

                        //Get user_id from email first
                        const userDB = await super.getUsersDBConnection();

                        const userIdSqlStatement = `
                            SELECT id
                            FROM users
                            WHERE email = ?
                            ;
                        `

                        const [idRow] = await userDB.mysqlConnection.query(
                            userIdSqlStatement,
                            username
                        );

                        console.log(idRow, "id row")

                        const id = idRow[0].id; 
                        const updateLoggedInSqlStatement = `

                        UPDATE user_details
                        SET last_logged_in = ?
                        WHERE user_id= ?
                        ;
                        `

                        const [updateResultUsername]  = await dbResponseObject.mysqlConnection.query(
                            updateLoggedInSqlStatement,
                            [
                                sqlFormattedDate,
                                id
                            ]
                        );

                        dbUpdateResponseObject.responseMessage = "Update successful"
                    
                        resolve(dbUpdateResponseObject);
                    } finally {
                        dbResponseObject.mysqlConnection?.commit(e=>{throw e});                        
                    }

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                };

            }catch(e){
                console.log(e);
                reject(dbUpdateResponseObject);
            }

        })
    }

    //Check translations left
    static checkTranslationsLeft(username: string): Promise<boolean>{
        return new Promise(async (resolve, reject)=>{

            try{
                //get user id 
                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                
                if(dbConnectionObject.responseMessage === "Connection unsuccessful"){
                    throw "Cannot connect"
                }

                try{
                    //SQL query

                    const checkTranslationsSqlQuery = `
                    SELECT * FROM translation_left 
                    WHERE user_id = ?;
                `

                    await dbConnectionObject.mysqlConnection?.beginTransaction(err =>{throw err});

                    const [queryResult] = await dbConnectionObject.mysqlConnection?.query(
                        checkTranslationsSqlQuery,
                        userId
                    )

                    if(queryResult.length === 0){

                        throw "error, no user data"
                    
                    } else if (queryResult.length > 0){

                        const translationsLeft = queryResult[0].translations_left;

                        if(translationsLeft > 0){
                            resolve(true)
                        } else if (translationsLeft === 0){
                            throw `No translations left`
                        }

                    } 

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                };

            }catch(e){

                reject(e)
            }
        })
    }

    //Get translation time left
    static getTranslationTimeLeft(username: string): Promise<number>{
        return new Promise(async (resolve, reject)=>{

            try{
                //get user id 
                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                

                try{
                    await dbConnectionObject.mysqlConnection?.beginTransaction(err =>{throw err});

                    const [translationTimeLeftResult] = await dbConnectionObject.mysqlConnection?.query(
                        preparedSQLStatements.translationsStatements.getTranslationTimeLeft,
                        userId
                    )

                    if(translationTimeLeftResult.length === 0){

                        throw "error, no user data"
                    
                    } else if (translationTimeLeftResult.length > 0){

                        const translationsRefreshTime = translationTimeLeftResult[0].translations_refresh;

                       
                        resolve(translationsRefreshTime)
                        

                    } 

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                };

            }catch(e){

                reject(e)
            }
        })
    }


    //Subtract translations left
    static updateTranslationsLeft(username: string): Promise<appTypes.TranslationsLeft>{
        return new Promise(async (resolve, reject)=>{

            try{

                //get user id 
                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                

                try{

                    await dbConnectionObject.mysqlConnection?.beginTransaction(err =>{throw err});

                    const [translationsLeftResult] = await dbConnectionObject.mysqlConnection?.query(
                        preparedSQLStatements.translationsStatements.checkTranslationsLeft,
                        userId
                    )

                    console.log(translationsLeftResult)

                    const [premiumQueryResult] = await dbConnectionObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.checkPremiumStatus,
                        userId
                    )

                    if(premiumQueryResult[0].premium){
                        //If user is premium user...

                        if(translationsLeftResult[0].translations_left === 250){
                            //If no translations done yet

                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;

                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.updateTranslationsLeft,
                                [
                                    newTranslationsLeft,
                                    userId
                                ]
                            );

                            //Set timer on translations left
        
                            const refreshEndTimeRaw = super.getTranslationRefreshEndTime();

                            const refreshEndTime = new Date(refreshEndTimeRaw);

                            const formattedDate = strftime('%Y-%m-%d %H:%M:%S', refreshEndTime)

                            
                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.setTimer,
                                [
                                    formattedDate,
                                    userId
                                ]
                            );


                            await dbConnectionObject.mysqlConnection?.commit();

                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            });
                        
                        } else if (translationsLeftResult[0].translations_left > 0){

                            //If translations less than 250

                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;

                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.updateTranslationsLeft,
                                [
                                    newTranslationsLeft,
                                    userId
                                ]
                            );
                            await dbConnectionObject.mysqlConnection?.commit();

                            const refreshEndTimeRaw = await this.getTranslationTimeLeft(username);
                            
                            const refreshEndTime = new Date(refreshEndTimeRaw);

                            const formattedDate = strftime('%Y-%m-%d %H:%M:%S', refreshEndTime)

                            console.log(refreshEndTime)

                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            })

                        } else if (translationsLeftResult[0].translations_left === 0){
                            throw "No more translations allowed"
                        }

                        

                    }else if (!premiumQueryResult[0].premium){

                        //If user is not premium...

                        if(translationsLeftResult[0].translations_left === 100){

                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;

                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.updateTranslationsLeft,
                                [
                                    newTranslationsLeft,
                                    userId
                                ]
                            );

                            //Set timer on translations left

                            const refreshEndTime = super.getTranslationRefreshEndTime();

                            
                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.setTimer,
                                [
                                    refreshEndTime,
                                    userId
                                ]
                            );

                            await dbConnectionObject.mysqlConnection?.commit();

                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            })
                        
                        } else if (translationsLeftResult[0].translations_left > 0){

                            

                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;
                            

                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.translationsStatements.updateTranslationsLeft,
                                [
                                    newTranslationsLeft,
                                    userId
                                ]
                            );
                            await dbConnectionObject.mysqlConnection?.commit();

                            const refreshEndTime = await this.getTranslationTimeLeft(username);


                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            })

                        } else if (translationsLeftResult[0].translations_left === 0){
                            throw "No more translations allowed"
                        }
                    }

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            
            }catch(e){
                reject(e)
            }
        })
    }
}

export default UserDetailsDatabase;