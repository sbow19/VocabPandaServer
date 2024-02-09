"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const strftime = require('strftime');
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
                    reject(dbAddUserResponseObject);
                    return;
                }
                //Begin transaction
                await connectionResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                //Add new user details
                const addUserSqlQuery = `INSERT INTO user_details VALUES (?, ?, ?, ?);`; //username, id, last_logged_in, premium
                await connectionResponseObject.mysqlConnection?.query(addUserSqlQuery, [
                    userCredentials.userName,
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
                await connectionResponseObject.mysqlConnection?.commit(); // end add new user transaction
                dbAddUserResponseObject.responseMessage = "New user added";
                dbAddUserResponseObject.responseCode = 0;
                dbAddUserResponseObject.addMessage = "User details added successfully";
                resolve(dbAddUserResponseObject);
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
                //End db transaction 
                dbResponseObject.mysqlConnection?.commit();
                //Configure response object on success
                dbUpdateResponseObject.responseMessage = "Upgrade successful";
                resolve(dbUpdateResponseObject);
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
                //End db transaction 
                dbResponseObject.mysqlConnection?.commit();
                //Configure response object on success
                dbUpdateResponseObject.responseMessage = "Downgrade successful";
                resolve(dbUpdateResponseObject);
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
                const updateLoggedInSqlStatement = `

                UPDATE user_details
                SET last_logged_in = ?
                WHERE username = ?;
                `;
                const updateResult = await dbResponseObject.mysqlConnection.query(updateLoggedInSqlStatement, [
                    sqlFormattedDate,
                    username
                ]);
                dbUpdateResponseObject.responseMessage = "Update successful";
                resolve(dbUpdateResponseObject);
            }
            catch (e) {
                console.log(e);
                reject(dbUpdateResponseObject);
            }
        });
    }
}
exports.default = UserDetailsDatabase;
//# sourceMappingURL=user_details_db.js.map