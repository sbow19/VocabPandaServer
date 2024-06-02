"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
const prepared_statements_1 = __importDefault(require("./prepared_statements"));
const strftime = require("strftime");
const dayjs = require("dayjs");
const UserDBPool = require("./user_logins/users_db_pool");
const UserDetailsDBPool = require("./user_details/user_details_pool");
const UserContentDBPool = require("./user_content/user_content_pool");
const UserBuffersDBPool = require("./user_buffers/user_buffers_pool");
const UserSyncDBPool = require("./user_sync/user_sync_pool");
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
                message: "Connection successful",
                mysqlConnection: null,
                operationType: "DB Connection",
                success: false
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
                message: "Connection successful",
                mysqlConnection: null,
                operationType: "DB Connection",
                success: false
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
                message: "Connection successful",
                mysqlConnection: null,
                operationType: "DB Connection",
                success: false
            };
            try {
                const databaseConnection = await UserDBPool.getConnection();
                dbResponseObject.mysqlConnection = databaseConnection;
                dbResponseObject.message = "Connection successful";
                resolve(dbResponseObject);
            }
            catch (e) {
                dbResponseObject.message = "Connection unsuccessful";
                reject(dbResponseObject);
            }
        });
    }
    ;
    static getUserSyncDBConnection() {
        return new Promise(async (resolve, reject) => {
            const dbResponseObject = {
                message: "Connection successful",
                mysqlConnection: null,
                operationType: "DB Connection",
                success: false
            };
            try {
                const databaseConnection = await UserSyncDBPool.getConnection();
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
    static getUsersBuffersDBConnection() {
        return new Promise(async (resolve, reject) => {
            const dbResponseObject = {
                message: "Connection successful",
                mysqlConnection: null,
                operationType: "DB Connection",
                success: false
            };
            try {
                const databaseConnection = await UserBuffersDBPool.getConnection();
                dbResponseObject.mysqlConnection = databaseConnection;
                dbResponseObject.message = "Connection successful";
                resolve(dbResponseObject);
            }
            catch (e) {
                dbResponseObject.message = "Connection unsuccessful";
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
    static userExists(userId) {
        //Check whether user exists
        return new Promise(async (resolve, reject) => {
            const userMatchResponse = {
                match: false
            };
            try {
                const usersDBResponseObject = await this.getUsersDBConnection(); //Gets pool connection
                try {
                    //Attempt sql queries
                    const [databaseResult] = await usersDBResponseObject.mysqlConnection?.query(prepared_statements_1.default.generalStatements.userIdMatch, [
                        userId,
                        userId
                    ]);
                    if (databaseResult.length === 0) {
                        //No user exists with this user id
                        resolve(userMatchResponse);
                    }
                    else if (databaseResult === 1) {
                        //User exists
                        userMatchResponse.match = true;
                        userMatchResponse.matchTerm = databaseResult;
                        resolve(userMatchResponse);
                    }
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
                //Other misc error.  Careful not to return boolean
                console.log(e);
                console.log(console.trace());
                reject(e);
            }
        });
    }
    /* SYNCING HANDLERS */
    static parseLocalContent = (localSyncRequests) => {
        return new Promise(async (resolve, reject) => {
            const localContentParsingResult = {
                localContent: false,
                contentArray: [],
                operationType: "Parse content queue",
                success: false
            };
            const contentArray = [];
            try {
                //Check if there is any content in each local sync request, and append to content array
                for (let localSyncRequest of localSyncRequests) {
                    //Check if there is any content in each local sync request, and append to content array
                    if (localSyncRequest.requestDetails.contentQueue) {
                        const requestContent = localSyncRequest.requestDetails.contentQueue;
                        contentArray.push(...requestContent); //Push contents of content queue
                    }
                    else if (!localSyncRequest.requestDetails.contentQueue) {
                        //There is no content queue in this request
                        localContentParsingResult.success = true;
                        resolve(localContentParsingResult);
                    }
                }
                //Check length of content array
                if (contentArray.length === 0) {
                    //No content to sync
                    localContentParsingResult.success = true;
                    resolve(localContentParsingResult);
                }
                else if (contentArray.length > 0) {
                    //We resolve content array
                    localContentParsingResult.success = true;
                    localContentParsingResult.contentArray = contentArray;
                    resolve(localContentParsingResult);
                }
            }
            catch (e) {
                console.log(e);
                reject(localContentParsingResult);
            }
        });
    };
}
exports.default = vpModel;
//# sourceMappingURL=models_template.js.map