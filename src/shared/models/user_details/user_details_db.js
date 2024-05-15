"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const strftime = require('strftime');
const UserDetailsDBPool = require("./user_details_pool");
class UserDetailsDatabase extends models_template_1.default {
    //Add new user details
    static addNewUserDetails(userCredentials, userId) {
        return new Promise(async (resolve, reject) => {
            const dbAddUserResponseObject = {
                responseCode: 0,
                responseMessage: "New user could not be added",
                addMessage: ""
            };
            const sqlFormattedDate = super.getCurrentTime();
            try {
                const connectionResponseObject = await super.getUsersDetailsDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    dbAddUserResponseObject.responseMessage = "New user could not be added";
                    dbAddUserResponseObject.addMessage = "Connection to users details database failed. Setup failed.";
                    const dbAddUserError = new Error("Error creating user", {
                        cause: dbAddUserResponseObject
                    });
                    reject(dbAddUserError);
                    return;
                }
                try {
                    //Begin transaction
                    await connectionResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Add new user details
                    const addUserSqlQuery = `INSERT INTO user_details VALUES (?, ?, ?, ?);`; //username, id, last_logged_in, premium
                    await connectionResponseObject.mysqlConnection?.query(addUserSqlQuery, [
                        userCredentials.username,
                        userId,
                        sqlFormattedDate,
                        0
                    ]);
                    //Add user default settings
                    const addUserSettingsSqlQuery = `INSERT INTO user_settings VALUES (?, ?, ?, ?, ?, ?);`; //user_id, timer_on, slider_val, target_lang, output_lang, default_project
                    await connectionResponseObject.mysqlConnection?.query(addUserSettingsSqlQuery, [
                        userId, //User id 
                        0, // timer set to false
                        10, //default no of turns in one flashcard play
                        "EN", //default target language is English
                        "EN", //default output language is English
                        "", //No default project set yet. 
                    ]);
                    //Add x plays/ translations left and refresh times
                    const nextPlaysSqlQuery = `INSERT INTO next_plays_refresh VALUES (?, ?);`; //user_id, game_refresh
                    const nextTranslationsSqlQuery = `INSERT INTO next_translations_refresh VALUES (?, ?);`; //user_id, translations_refresh
                    const playLeftSqlQuery = `INSERT INTO plays_left VALUES (?, ?);`; //user_id, plays_left
                    const translationsLeftSqlQuery = `INSERT INTO translation_left VALUES (?, ?);`; //user_id, translation_left
                    await connectionResponseObject.mysqlConnection?.query(nextPlaysSqlQuery, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(nextTranslationsSqlQuery, [userId, null]);
                    await connectionResponseObject.mysqlConnection?.query(playLeftSqlQuery, [userId, 10]);
                    await connectionResponseObject.mysqlConnection?.query(translationsLeftSqlQuery, [userId, 40]);
                    await connectionResponseObject.mysqlConnection?.commit(); // commit add new user transaction        
                    dbAddUserResponseObject.responseMessage = "New user added";
                    dbAddUserResponseObject.responseCode = 0;
                    dbAddUserResponseObject.addMessage = "User details added successfully";
                    resolve(dbAddUserResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbAddUserResponseObject.responseMessage = "New user could not be added";
                dbAddUserResponseObject.addMessage = "Unknown error";
                reject(dbAddUserResponseObject);
            }
        });
    }
    ;
    //Ugrade user to premium
    static upgradeToPremium(username) {
        return new Promise(async (resolve, reject) => {
            const dbUpdateResponseObject = {
                responseCode: 0,
                responseMessage: "upgrade unsuccessful",
                updateMessage: ""
            };
            try {
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                if (dbResponseObject.responseMessage === "Connection unsuccessful") {
                    reject(dbUpdateResponseObject);
                    return;
                }
                ;
                try {
                    //start db transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Get user Id
                    const { matchMessage } = await super.getUserId(username); //retrieves userId from response object
                    const userId = matchMessage;
                    //upgrade user in user details database
                    const upgradeSqlStatement = `

                    UPDATE user_details
                    SET premium = 1
                    WHERE username = ?;
                    `;
                    const updateResult = await dbResponseObject.mysqlConnection.query(upgradeSqlStatement, username);
                    //Add details to user_details.premium_users
                    const membershipEndTime = super.getMembershipEndTime();
                    const savePremiumInfoSql = `INSERT INTO premium_users VALUES(?, ?, ?);`; //user_id,  username, membership_end
                    await dbResponseObject.mysqlConnection?.query(savePremiumInfoSql, [
                        userId,
                        username,
                        membershipEndTime
                    ]);
                    //Update x games and refresh times
                    const nextPlaysSqlQuery = `UPDATE next_plays_refresh SET game_refresh = ? WHERE user_id = ?;`; //user_id, game_refresh
                    const nextTranslationsSqlQuery = `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;`; //user_id, translations_refresh
                    const playLeftSqlQuery = `UPDATE plays_left SET plays_left = ? WHERE user_id = ?;`; //user_id, plays_left
                    const translationsLeftSqlQuery = `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;`; //user_id, translation_left
                    await dbResponseObject.mysqlConnection.query(nextPlaysSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(nextTranslationsSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(playLeftSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(translationsLeftSqlQuery, [120, userId]);
                    //Commit db transaction 
                    dbResponseObject.mysqlConnection?.commit();
                    //Configure response object on success
                    dbUpdateResponseObject.responseMessage = "Upgrade successful";
                    resolve(dbUpdateResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e);
                reject(dbUpdateResponseObject);
            }
        });
    }
    //downgrade user from premium
    static downgradeToFree(username) {
        return new Promise(async (resolve, reject) => {
            const dbUpdateResponseObject = {
                responseCode: 0,
                responseMessage: "Downgrade unsuccessful",
                updateMessage: ""
            };
            try {
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                if (dbResponseObject.responseMessage === "Connection unsuccessful") {
                    reject(dbUpdateResponseObject);
                    return;
                }
                try {
                    //Start transaction 
                    dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //upgrade user in user details database
                    const downgradeSqlStatement = `

                    UPDATE user_details
                    SET premium = 0
                    WHERE username = ?;
                    `;
                    const downgradeResult = await dbResponseObject.mysqlConnection.query(downgradeSqlStatement, username);
                    //Get user Id
                    const { matchMessage } = await super.getUserId(username); //retrieves userId from response object
                    const userId = matchMessage;
                    //Remove details to user_details.premium_users
                    const removePremiumInfoSql = `DELETE FROM premium_users WHERE user_id = ?;`; //user_id
                    await dbResponseObject.mysqlConnection?.query(removePremiumInfoSql, userId);
                    //Update x games and refresh times
                    const nextPlaysSqlQuery = `UPDATE next_plays_refresh SET game_refresh = ? WHERE user_id = ?;`; //user_id, game_refresh
                    const nextTranslationsSqlQuery = `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;`; //user_id, translations_refresh
                    const playLeftSqlQuery = `UPDATE plays_left SET plays_left = ? WHERE user_id = ?;`; //user_id, plays_left
                    const translationsLeftSqlQuery = `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;`; //user_id, translation_left
                    await dbResponseObject.mysqlConnection.query(nextPlaysSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(nextTranslationsSqlQuery, [null, userId]);
                    await dbResponseObject.mysqlConnection.query(playLeftSqlQuery, [10, userId]);
                    await dbResponseObject.mysqlConnection.query(translationsLeftSqlQuery, [40, userId]);
                    //Commit db transaction 
                    dbResponseObject.mysqlConnection?.commit();
                    //Configure response object on success
                    dbUpdateResponseObject.responseMessage = "Downgrade successful";
                    resolve(dbUpdateResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e);
                reject(dbUpdateResponseObject);
            }
        });
    }
    //Update last logged in
    static updateLastLoggedIn(username) {
        return new Promise(async (resolve, reject) => {
            const dbUpdateResponseObject = {
                responseCode: 0,
                responseMessage: "Update unsuccessful",
                updateMessage: ""
            };
            const sqlFormattedDate = super.getCurrentTime();
            try {
                const dbResponseObject = await super.getUsersDetailsDBConnection();
                if (dbResponseObject.responseMessage === "Connection unsuccessful") {
                    reject(dbUpdateResponseObject);
                    return;
                }
                try {
                    dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    try {
                        const updateLoggedInSqlStatement = `

                        UPDATE user_details
                        SET last_logged_in = ?
                        WHERE username = ?
                        ;
                        `;
                        const [updateResultUsername] = await dbResponseObject.mysqlConnection.query(updateLoggedInSqlStatement, [
                            sqlFormattedDate,
                            username
                        ]);
                        console.log(updateResultUsername, "update result by user");
                        if (updateResultUsername.affectedRows === 0) {
                            throw false;
                        }
                        else if (updateResultUsername.affectedRows === 1) {
                            dbUpdateResponseObject.responseMessage = "Update successful";
                            resolve(dbUpdateResponseObject);
                        }
                        ;
                    }
                    catch (e) {
                        //Get user_id from email first
                        const userDB = await super.getUsersDBConnection();
                        const userIdSqlStatement = `
                            SELECT id
                            FROM users
                            WHERE email = ?
                            ;
                        `;
                        const [idRow] = await userDB.mysqlConnection.query(userIdSqlStatement, username);
                        console.log(idRow, "id row");
                        const id = idRow[0].id;
                        const updateLoggedInSqlStatement = `

                        UPDATE user_details
                        SET last_logged_in = ?
                        WHERE user_id= ?
                        ;
                        `;
                        const [updateResultUsername] = await dbResponseObject.mysqlConnection.query(updateLoggedInSqlStatement, [
                            sqlFormattedDate,
                            id
                        ]);
                        dbUpdateResponseObject.responseMessage = "Update successful";
                        resolve(dbUpdateResponseObject);
                    }
                    finally {
                        dbResponseObject.mysqlConnection?.commit(e => { throw e; });
                    }
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserDetailsDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
                ;
            }
            catch (e) {
                console.log(e);
                reject(dbUpdateResponseObject);
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
                    await dbConnectionObject.mysqlConnection?.beginTransaction(err => { throw err; });
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
    //Subtract translations left
    static updateTranslationsLeft(username) {
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
                    //SQL query to get translatoins left
                    const checkTranslationsSqlQuery = `
                        SELECT * FROM translation_left 
                        WHERE user_id = ?;
                    `;
                    //query to check if premium
                    const checkPremiumStatus = `SELECT *  FROM user_details WHERE user_id = ?;`;
                    await dbConnectionObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    const [queryResult] = await dbConnectionObject.mysqlConnection?.query(checkTranslationsSqlQuery, userId);
                    const [premiumQueryResult] = await dbConnectionObject.mysqlConnection?.query(checkPremiumStatus, userId);
                    if (premiumQueryResult[0].premium) {
                        //If user is premium user...
                        if (queryResult[0].translations_left === 120) {
                            const newTranslationsLeft = queryResult[0].translations_left - 1;
                            const updateTranslationsQuery = `
                                UPDATE translation_left
                                SET translations_left = ? 
                                WHERE user_id = ?
                                ;
                            `;
                            await dbConnectionObject.mysqlConnection?.query(updateTranslationsQuery, [
                                newTranslationsLeft,
                                userId
                            ]);
                            //Set timer on translations left
                            const setTimerSqlQuery = `
                                UPDATE next_translations_refresh 
                                SET translations_refresh = ?
                                WHERE user_id = ?
                                ;
                            `;
                            const refreshEndTime = super.getTranslationRefreshEndTime();
                            await dbConnectionObject.mysqlConnection?.query(setTimerSqlQuery, [
                                refreshEndTime,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve(newTranslationsLeft);
                        }
                        else if (queryResult[0].translations_left > 0) {
                            const newTranslationsLeft = queryResult[0].translations_left - 1;
                            const updateTranslationsQuery = `
                                UPDATE translation_left
                                SET translations_left = ? 
                                WHERE user_id = ?
                                ;
                            `;
                            await dbConnectionObject.mysqlConnection?.query(updateTranslationsQuery, [
                                newTranslationsLeft,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve(newTranslationsLeft);
                        }
                        else if (queryResult[0].translations_left === 0) {
                            throw "No more translations allowed";
                        }
                    }
                    else if (!premiumQueryResult[0].premium) {
                        //If user is not premium...
                        if (queryResult[0].translations_left === 40) {
                            const newTranslationsLeft = queryResult[0].translations_left - 1;
                            const updateTranslationsQuery = `
                                UPDATE translation_left
                                SET translations_left = ? 
                                WHERE user_id = ?
                                ;
                            `;
                            await dbConnectionObject.mysqlConnection?.query(updateTranslationsQuery, [
                                newTranslationsLeft,
                                userId
                            ]);
                            //Set timer on translations left
                            const setTimerSqlQuery = `
                                UPDATE next_translations_refresh 
                                SET translations_refresh = ?
                                WHERE user_id = ?
                                ;
                            `;
                            const refreshEndTime = super.getTranslationRefreshEndTime();
                            await dbConnectionObject.mysqlConnection?.query(setTimerSqlQuery, [
                                refreshEndTime,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve(newTranslationsLeft);
                        }
                        else if (queryResult[0].translations_left > 0) {
                            const newTranslationsLeft = queryResult[0].translations_left - 1;
                            const updateTranslationsQuery = `
                                UPDATE translation_left
                                SET translations_left = ? 
                                WHERE user_id = ?
                                ;
                            `;
                            await dbConnectionObject.mysqlConnection?.query(updateTranslationsQuery, [
                                newTranslationsLeft,
                                userId
                            ]);
                            await dbConnectionObject.mysqlConnection?.commit();
                            resolve(newTranslationsLeft);
                        }
                        else if (queryResult[0].translations_left === 0) {
                            throw "No more translations allowed";
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
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.default = UserDetailsDatabase;
//# sourceMappingURL=user_details_db.js.map