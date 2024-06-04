"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const strftime = require('strftime');
const UserDetailsDBPool = require("./user_details_pool");
const UserBuffersDBPool = require("../user_buffers/user_buffers_pool");
const UserSyncDBPool = require("../user_sync/user_sync_pool");
const prepared_statements_1 = __importDefault(require("../prepared_statements"));
class UserDetailsDatabase extends models_template_1.default {
    //Add new user details
    static addNewUserDetails(userCredentials, userId, deviceId) {
        return new Promise(async (resolve, reject) => {
            const addUserDetailsResponse = {
                success: false,
                operationType: "DB Add User",
                specificErrorCode: "",
                resultArray: null
            };
            const sqlFormattedDate = super.getCurrentTime();
            let appValue = 0;
            let extensionValue = 0;
            if (userCredentials.deviceType === "app") {
                appValue = 1;
            }
            else if (userCredentials.deviceType === "extension") {
                extensionValue = 1;
            }
            try {
                const connectionResponseObject = await super.getUsersDetailsDBConnection(); //Get connection to user_logins table
                const connectionResponseObjectBuffer = await super.getUsersBuffersDBConnection();
                const connectionResponseObjectSync = await super.getUserSyncDBConnection();
                //Begin transaction
                await connectionResponseObject.mysqlConnection?.beginTransaction();
                await connectionResponseObjectBuffer.mysqlConnection?.beginTransaction();
                await connectionResponseObjectSync.mysqlConnection?.beginTransaction();
                try {
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addUserDetails, [
                        userCredentials.username,
                        userId,
                        sqlFormattedDate,
                        0
                    ]);
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addDefaultSettings, [
                        userId, //User id 
                        0, // timer set to false
                        10, //default no of turns in one flashcard play
                        "EN", //default target language is English
                        "EN", //default output language is English
                        "", //No default project set yet. 
                    ]);
                    //Add x plays/ translations left and refresh times
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addDefaultNextPlaysRefresh, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addDefaultNextTranslationsRefresh, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addDefaultPlaysLeft, [userId, 10]);
                    await connectionResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.addDefaultTranslationsLeft, [userId, 100]);
                    //Add details to buffer 
                    const bufferContent = [];
                    const jsonString = JSON.stringify(bufferContent);
                    await connectionResponseObjectBuffer.mysqlConnection?.query(prepared_statements_1.default.bufferStatements.addNewUserApp, [userId, jsonString, deviceId]);
                    await connectionResponseObjectBuffer.mysqlConnection?.query(prepared_statements_1.default.bufferStatements.addNewUserExtension, [userId, jsonString, deviceId]);
                    await connectionResponseObjectBuffer.mysqlConnection?.query(prepared_statements_1.default.bufferStatements.addNewUserHub, [userId, appValue, extensionValue]);
                    //Add details to sync 
                    await connectionResponseObjectSync.mysqlConnection?.query(prepared_statements_1.default.syncStatements.addNewUser, [0, userId, deviceId, null]);
                    // commit add new user transaction  
                    await connectionResponseObject.mysqlConnection?.commit();
                    await connectionResponseObjectSync.mysqlConnection?.commit();
                    await connectionResponseObjectBuffer.mysqlConnection?.commit();
                    addUserDetailsResponse.success = true;
                    resolve(addUserDetailsResponse);
                }
                catch (e) {
                    connectionResponseObject.mysqlConnection?.rollback();
                    connectionResponseObjectBuffer.mysqlConnection?.rollback();
                    connectionResponseObjectSync.mysqlConnection?.rollback();
                    console.log("SQL ERROR, creating new user", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                    UserBuffersDBPool.releaseConnection(connectionResponseObjectBuffer);
                    UserSyncDBPool.releaseConnection(connectionResponseObjectSync);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    addUserDetailsResponse.specificErrorCode = e.code;
                    reject(addUserDetailsResponse);
                }
                else {
                    addUserDetailsResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    }
    ;
    //Update user settings
    static updateUserSettings = (settingsObject) => {
        return new Promise(async (resolve, reject) => {
            const settingsUpdateResponse = {
                success: false,
                specificErrorCode: "",
                operationType: "DB Settings Operation"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                //Begin transaction
                await dbResponseObject.mysqlConnection?.beginTransaction();
                try {
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.settingsStatements.updateUserSettings, [
                        settingsObject.gameTimerOn,
                        settingsObject.gameNoOfTurns,
                        settingsObject.defaultTargetLanguage,
                        settingsObject.defaultOutputLanguage,
                        settingsObject.defaultProject,
                        settingsObject.userId
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        settingsUpdateResponse.specificErrorCode = "No rows affected";
                        reject(settingsUpdateResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        settingsUpdateResponse.success = true;
                        resolve(settingsUpdateResponse);
                    }
                }
                catch (e) {
                    await dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, updating settings", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    settingsUpdateResponse.specificErrorCode = e.code;
                    reject(settingsUpdateResponse);
                }
                else {
                    settingsUpdateResponse.specificErrorCode = "Unknown error";
                    reject(settingsUpdateResponse);
                }
            }
        });
    };
    static getUserSettings = (userId) => {
        return new Promise(async (resolve, reject) => {
            const fetchResult = {
                operationType: "DB Settings Operation",
                specificErrorCode: "",
                success: false,
                resultArray: {}
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                try {
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.settingsStatements.getUserSettings, [
                        userId
                    ]);
                    if (queryResponse.affectedRows === 0) {
                        //No user settings identified for this user
                        fetchResult.specificErrorCode = "No rows affected";
                        reject(fetchResult);
                    }
                    else if (queryResponse.affectedRows === 1) {
                        const userSettings = queryResponse[0];
                        fetchResult.success = true;
                        fetchResult.resultArray.defaultOutputLanguage = userSettings["output_lang"];
                        fetchResult.resultArray.defaultProject = userSettings["default_project"];
                        fetchResult.resultArray.defaultTargetLanguage = userSettings["target_lang"];
                        fetchResult.resultArray.gameNoOfTurns = userSettings["slider_val"];
                        fetchResult.resultArray.gameTimerOn = userSettings["timer_on"];
                        resolve(fetchResult);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, fetching settings", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    fetchResult.specificErrorCode = e.code;
                    reject(fetchResult);
                }
                else {
                    e.specificErrorCode = "Unknown error";
                    reject(fetchResult);
                }
            }
        });
    };
    //Get user premium status
    static checkPremiumStatus = (userId) => {
        return new Promise(async (resolve, reject) => {
            const fetchResult = {
                success: false,
                resultArray: false,
                specificErrorCode: "",
                operationType: "Get Premium Status"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                try {
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.checkPremiumStatus, [
                        userId
                    ]);
                    if (queryResponse.affectedRows === 0) {
                        //No user found 
                        reject(fetchResult);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        //User found
                        if (queryResponse[0].premium === 1) {
                            fetchResult.resultArray = true;
                        }
                        else if (queryResponse[0].premium === 0) {
                            fetchResult.resultArray = false;
                        }
                        fetchResult.success = true;
                        resolve(fetchResult);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, fetching premium", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    fetchResult.specificErrorCode = e.code;
                    reject(fetchResult);
                }
                else {
                    e.specificErrorCode = "Unknown error";
                    reject(fetchResult);
                }
                ;
            }
        });
    };
    //Update last logged in
    static updateLastLoggedIn(userId) {
        return new Promise(async (resolve, reject) => {
            const lastLoggedInResponse = {
                success: false,
                specificErrorCode: "",
                operationType: "Update Last Logged In",
                resultArray: null
            };
            const sqlFormattedDate = super.getCurrentTime();
            try {
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                await dbResponseObject.mysqlConnection?.beginTransaction();
                try {
                    const [updateResultUsername,] = await dbResponseObject.mysqlConnection.query(prepared_statements_1.default.accountStatements.updateLastLoggedIn, [
                        sqlFormattedDate,
                        userId
                    ]);
                    dbResponseObject.mysqlConnection?.commit();
                    if (updateResultUsername.affectedRows === 0) {
                        lastLoggedInResponse.specificErrorCode = "No rows affected";
                        reject(lastLoggedInResponse);
                    }
                    else if (updateResultUsername.affectedRows === 1) {
                        lastLoggedInResponse.success = true;
                        resolve(lastLoggedInResponse);
                    }
                    ;
                }
                catch (e) {
                    dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, updating logged in time", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
                ;
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    lastLoggedInResponse.specificErrorCode = e.code;
                    reject(lastLoggedInResponse);
                }
                else {
                    lastLoggedInResponse.specificErrorCode = "Unknown error";
                    reject(lastLoggedInResponse);
                }
            }
        });
    }
    //Check translations left
    static checkTranslationsLeft(username) {
        return new Promise(async (resolve, reject) => {
            try {
                //get user id 
                const { matchMessage } = await super.getUserId(username);
                const userId = matchMessage;
                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                if (dbConnectionObject.responseMessage === "Connection unsuccessful") {
                    throw "Cannot connect";
                }
                try {
                    //SQL query
                    const checkTranslationsSqlQuery = `
                    SELECT * FROM translation_left 
                    WHERE user_id = ?;
                `;
                    const [queryResult] = await dbConnectionObject.mysqlConnection?.query(checkTranslationsSqlQuery, userId);
                    if (queryResult.length === 0) {
                        throw "error, no user data";
                    }
                    else if (queryResult.length > 0) {
                        const translationsLeft = queryResult[0].translations_left;
                        if (translationsLeft > 0) {
                            resolve(true);
                        }
                        else if (translationsLeft === 0) {
                            throw `No translations left`;
                        }
                    }
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
                ;
            }
            catch (e) {
                reject(e);
            }
        });
    }
    //Get translation time left
    static getTranslationTimeLeft(username) {
        return new Promise(async (resolve, reject) => {
            try {
                //get user id 
                const { matchMessage } = await super.getUserId(username);
                const userId = matchMessage;
                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection?.beginTransaction();
                    const [translationTimeLeftResult] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.getTranslationTimeLeft, userId);
                    if (translationTimeLeftResult.length === 0) {
                        throw "error, no user data";
                    }
                    else if (translationTimeLeftResult.length > 0) {
                        const translationsRefreshTime = translationTimeLeftResult[0].translations_refresh;
                        resolve(translationsRefreshTime);
                    }
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
                ;
            }
            catch (e) {
                reject(e);
            }
        });
    }
    //Subtract translations left
    static updateTranslationsLeft(username) {
        return new Promise(async (resolve, reject) => {
            try {
                const { matchMessage } = await super.getUserId(username);
                const userId = matchMessage;
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                await dbConnectionObject.mysqlConnection?.beginTransaction();
                try {
                    const [translationsLeftResult] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.checkTranslationsLeft, userId);
                    console.log(translationsLeftResult);
                    const [premiumQueryResult] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.accountStatements.checkPremiumStatus, userId);
                    if (premiumQueryResult[0].premium) {
                        //If user is premium user...
                        if (translationsLeftResult[0].translations_left === 250) {
                            //If no translations done yet
                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.updateTranslationsLeft, [
                                newTranslationsLeft,
                                userId
                            ]);
                            //Set timer on translations left
                            const refreshEndTimeRaw = super.getTranslationRefreshEndTime();
                            const refreshEndTime = new Date(refreshEndTimeRaw);
                            const formattedDate = strftime('%Y-%m-%d %H:%M:%S', refreshEndTime);
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.setTimer, [
                                formattedDate,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            });
                        }
                        else if (translationsLeftResult[0].translations_left > 0) {
                            //If translations less than 250
                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.updateTranslationsLeft, [
                                newTranslationsLeft,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            const refreshEndTimeRaw = await this.getTranslationTimeLeft(username);
                            const refreshEndTime = new Date(refreshEndTimeRaw);
                            const formattedDate = strftime('%Y-%m-%d %H:%M:%S', refreshEndTime);
                            console.log(refreshEndTime);
                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            });
                        }
                        else if (translationsLeftResult[0].translations_left === 0) {
                            throw "No more translations allowed";
                        }
                    }
                    else if (!premiumQueryResult[0].premium) {
                        //If user is not premium...
                        if (translationsLeftResult[0].translations_left === 100) {
                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.updateTranslationsLeft, [
                                newTranslationsLeft,
                                userId
                            ]);
                            //Set timer on translations left
                            const refreshEndTime = super.getTranslationRefreshEndTime();
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.setTimer, [
                                refreshEndTime,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            });
                        }
                        else if (translationsLeftResult[0].translations_left > 0) {
                            const newTranslationsLeft = translationsLeftResult[0].translations_left - 1;
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.translationsStatements.updateTranslationsLeft, [
                                newTranslationsLeft,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            const refreshEndTime = await this.getTranslationTimeLeft(username);
                            resolve({
                                translationsLeft: newTranslationsLeft,
                                translationRefreshTime: refreshEndTime
                            });
                        }
                        else if (translationsLeftResult[0].translations_left === 0) {
                            throw "No more translations allowed";
                        }
                    }
                }
                catch (e) {
                    await dbConnectionObject.mysqlConnection?.rollback();
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (e) {
                reject(e);
            }
        });
    }
    //Update plays left an plays refresh time
    static updatePlaysLeft(playsDetails) {
        return new Promise(async (resolve, reject) => {
            const DBOperationResult = {
                operationType: "DB Plays Operation",
                specificErrorCode: "", //My SQL error codes
                success: false
            };
            try {
                //Get db connection
                const dbConnectionObject = await super.getUsersDetailsDBConnection();
                //Begin transaction
                await dbConnectionObject.mysqlConnection?.beginTransaction();
                try {
                    const [queryResponse1,] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.generalStatements.updatePlays, [
                        playsDetails.playsLeft,
                        playsDetails.userId
                    ]);
                    const [queryResponse2,] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.generalStatements.updatePlaysRefreshTime, [
                        playsDetails.playsRefreshTime,
                        playsDetails.userId
                    ]);
                    await dbConnectionObject.mysqlConnection?.commit();
                    if (queryResponse1.affectedRows === 0 || queryResponse2.affectedRows === 0) {
                        //Both tables need to be updated
                        DBOperationResult.specificErrorCode = "No rows affected";
                        reject(DBOperationResult);
                    }
                    else if (queryResponse1.affectedRows > 0 && queryResponse2.affectedRows > 0) {
                        DBOperationResult.success = true;
                        resolve(DBOperationResult);
                    }
                }
                catch (e) {
                    await dbConnectionObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, updating plays left", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    DBOperationResult.specificErrorCode = e.code;
                    reject(DBOperationResult);
                }
                else {
                    DBOperationResult.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    }
}
exports.default = UserDetailsDatabase;
//# sourceMappingURL=user_details_db.js.map