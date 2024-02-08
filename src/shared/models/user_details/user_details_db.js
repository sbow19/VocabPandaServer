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
                    resolve(dbAddUserResponseObject);
                    return;
                }
                const addUserSqlQuery = `INSERT INTO user_details VALUES (?, ?, ?, ?);`; //username, id, last_logged_in, premium
                const addResult = await connectionResponseObject.mysqlConnection.query(addUserSqlQuery, [
                    userCredentials.userName,
                    userId,
                    sqlFormattedDate,
                    0
                ]);
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
                resolve(dbAddUserResponseObject);
            }
        });
    }
    //Update premium status
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
                //upgrade user in user details database
                const upgradeSqlStatement = `

                UPDATE user_details
                SET premium = 0
                WHERE username = ?;
                `;
                const updateResult = await dbResponseObject.mysqlConnection.query(upgradeSqlStatement, username);
                //Fetch user_id from users schema
                const usersDBResponseObject = await super.getUsersDBConnection();
                if (usersDBResponseObject.responseMessage === "Connection unsuccessful") {
                    reject(dbUpdateResponseObject);
                    return;
                }
                const fetchUserId = `
                    SELECT id FROM users
                    WHERE username = ?
                    ;
                `;
                const [databaseResult] = await usersDBResponseObject.mysqlConnection?.query(fetchUserId, username);
                let userId = databaseResult[0].id;
                //Add details to user_details.premium_users
                const membershipEndTime = super.getMembershipEndTime();
                const savePremiumInfoSql = `INSERT INTO premium_users VALUES(?, ?, ?);`; //user_id,  username, membership_end
                await dbResponseObject.mysqlConnection?.query(savePremiumInfoSql, [
                    userId,
                    username,
                    membershipEndTime
                ]);
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