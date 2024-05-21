"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
const mysql = require("mysql2/promise");
const strftime = require("strftime");
const dayjs = require("dayjs");
const UserDBPool = require("./user_logins/users_db_pool");
const UserDetailsDBPool = require("./user_details/user_details_pool");
const UserContentDBPool = require("./user_content/user_content_pool");
class vpModel {
    constructor() {
    }
    static generateUUID() {
        const UUID = uuidv4();
        return UUID;
    }
    ;
    static getCurrentTime() {
        // Get current datetime
        const currentDate = new Date();
        // Format the current datetime to SQL format
        const sqlFormattedDate = strftime('%Y-%m-%d %H:%M:%S', currentDate);
        return sqlFormattedDate;
    }
    static getMembershipEndTime() {
        // Get current datetime
        const currentDate = dayjs();
        const membershipDelta = currentDate.add(1, "month");
        console.log(membershipDelta.toDate(), currentDate.format());
        // Format the current datetime to SQL format
        const sqlFormattedDate = strftime('%Y-%m-%d %H:%M:%S', membershipDelta.toDate());
        return sqlFormattedDate;
    }
    ;
    static getTokenExpiry() {
        // Get current datetime
        const currentDate = dayjs();
        const tokenDelta = currentDate.add(1, "hour");
        console.log(tokenDelta.toDate(), currentDate.format());
        // Format the current datetime to SQL format
        const sqlFormattedDate = strftime('%Y-%m-%d %H:%M:%S', tokenDelta.toDate());
        return sqlFormattedDate;
    }
    static getTranslationRefreshEndTime() {
        // Get current datetime
        const currentDate = dayjs();
        const membershipDelta = currentDate.add(1, "week");
        console.log(membershipDelta.toDate(), currentDate.format());
        // Format the current datetime to SQL format
        const sqlFormattedDate = strftime('%Y-%m-%d %H:%M:%S', membershipDelta.toDate());
        return sqlFormattedDate;
    }
    static getUsersDetailsDBConnection() {
        return new Promise(async (resolve, reject) => {
            const dbResponseObject = {
                responseCode: 0,
                responseMessage: "Connection successful",
                mysqlConnection: null
            };
            try {
                const databaseConnection = await UserDetailsDBPool.getConnection();
                dbResponseObject.mysqlConnection = databaseConnection;
                dbResponseObject.responseMessage = "Connection successful";
                resolve(dbResponseObject);
            }
            catch (e) {
                dbResponseObject.responseMessage = "Connection unsuccessful";
                reject(dbResponseObject);
            }
        });
    }
    ;
    static getUsersContentDBConnection() {
        return new Promise(async (resolve, reject) => {
            const dbResponseObject = {
                responseCode: 0,
                responseMessage: "Connection successful",
                mysqlConnection: null
            };
            try {
                const databaseConnection = await UserContentDBPool.getConnection();
                dbResponseObject.mysqlConnection = databaseConnection;
                dbResponseObject.responseMessage = "Connection successful";
                resolve(dbResponseObject);
            }
            catch (e) {
                dbResponseObject.responseMessage = "Connection unsuccessful";
                reject(dbResponseObject);
            }
        });
    }
    //Get DB connection re every function
    static getUsersDBConnection() {
        return new Promise(async (resolve, reject) => {
            const dbResponseObject = {
                responseCode: 0,
                responseMessage: "Connection successful",
                mysqlConnection: null
            };
            try {
                const databaseConnection = await UserDBPool.getConnection();
                dbResponseObject.mysqlConnection = databaseConnection;
                dbResponseObject.responseMessage = "Connection successful";
                console.log("connection to user db was successful");
                resolve(dbResponseObject);
            }
            catch (e) {
                dbResponseObject.responseMessage = "Connection unsuccessful";
                console.log("connection to user db was unsuccessful");
                reject(dbResponseObject);
            }
        });
    }
    ;
    static getUserId(username) {
        return new Promise(async (resolve, reject) => {
            //Fetch user_id from users schema
            const DBMatchResponseObject = {
                responseCode: 0,
                responseMessage: "No match found",
                matchMessage: ""
            };
            try {
                const usersDBResponseObject = await this.getUsersDBConnection(); //Gets pool connection
                if (usersDBResponseObject.responseMessage === "Connection unsuccessful") {
                    DBMatchResponseObject.matchMessage = usersDBResponseObject;
                    reject(DBMatchResponseObject);
                    return;
                }
                //Attempt sql queries
                try {
                    const fetchUserId = `
                        SELECT id FROM users
                        WHERE username = ?
                        ;
                    `;
                    const [databaseResult] = await usersDBResponseObject.mysqlConnection?.query(fetchUserId, username);
                    const userId = databaseResult[0].id;
                    DBMatchResponseObject.matchMessage = userId;
                    DBMatchResponseObject.responseMessage = "Match found";
                    resolve(DBMatchResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release connection regardless of search outcome
                    UserDBPool.releaseConnection(usersDBResponseObject.mysqlConnection);
                }
                ;
            }
            catch (e) {
                console.log(e);
                console.log(console.trace());
                reject(DBMatchResponseObject);
            }
        });
    }
}
exports.default = vpModel;
//# sourceMappingURL=models_template.js.map