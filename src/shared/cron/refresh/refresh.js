"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
const UserDetailsDBPool = require("../../models/user_details/user_details_pool");
const prepared_statements_1 = __importDefault(require("@shared/models/prepared_statements"));
class RefreshCounter {
    static playsRefreshChecker() {
        return new Promise(async (resolve, reject) => {
            const refreshResponse = {
                success: false,
                operationType: "Plays Refresh Check",
                specificErrorCode: "",
                resultArray: null
            };
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            try {
                const dbConnectionObject = await user_details_db_1.default.getUsersDetailsDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection?.beginTransaction();
                    const [queryResults,] = await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.checkPlaysRefresh, currentTime);
                    if (queryResults.length > 0) {
                        //Update next refresh timer
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.updatePlaysRefresh, [
                                user.user_id
                            ]);
                        }
                        //Update plays left table
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.updatePlaysLeft, [
                                user.user_id
                            ]);
                        }
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    else if (queryResults.length === 0) {
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    await dbConnectionObject.mysqlConnection?.commit();
                }
                catch (e) {
                    console.log("SQL ERROR, updating plays refresh", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    refreshResponse.specificErrorCode = e.code;
                    reject(refreshResponse);
                }
                else {
                    refreshResponse.specificErrorCode = "Unknown error";
                    reject(refreshResponse);
                }
            }
        });
    }
    ;
    static translationsRefreshChecker() {
        return new Promise(async (resolve, reject) => {
            const refreshResponse = {
                success: false,
                operationType: "Translations Refresh Check",
                specificErrorCode: "",
                resultArray: null
            };
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            try {
                const dbConnectionObject = await user_details_db_1.default.getUsersDetailsDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection.beginTransaction();
                    const [queryResults,] = await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.checkTranslationsRefresh, currentTime);
                    if (queryResults.length > 0) {
                        //Update refresh timer
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.updateTranslationsRefresh, user.user_id);
                        }
                        //Update translations left
                        for (let user of queryResults) {
                            //Check if user is premium or not
                            const [premiumQueryResult,] = await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.getPremiumStatus, user.user_id);
                            if (premiumQueryResult[0].premium === 1) {
                                await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.updateTranslationsPremium, user.user_id);
                            }
                            else if (premiumQueryResult[0].premium === 0) {
                                await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.updateTranslationsFree, user.user_id);
                            }
                        }
                        ;
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    else if (queryResults.length === 0) {
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    await dbConnectionObject.mysqlConnection?.commit();
                }
                catch (e) {
                    console.log("SQL ERROR, updating translations left", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    refreshResponse.specificErrorCode = e.code;
                    reject(refreshResponse);
                }
                else {
                    refreshResponse.specificErrorCode = "Unknown error";
                    reject(refreshResponse);
                }
            }
        });
    }
    ;
    static premiumUserChecker() {
        return new Promise(async (resolve, reject) => {
            const refreshResponse = {
                success: false,
                operationType: "Premium User Check",
                specificErrorCode: "",
                resultArray: null
            };
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            try {
                const dbConnectionObject = await user_details_db_1.default.getUsersDetailsDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection?.beginTransaction();
                    const [queryResults,] = await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.checkPremiumUsers, currentTime);
                    if (queryResults.length > 0) {
                        //Delete premium user
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection?.query(prepared_statements_1.default.CRONQueries.deletePremiumUser, user.user_id);
                        }
                        //Update plays left table
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.updatePlaysLeft, user.user_id);
                        }
                        //update translations left
                        for (let user of queryResults) {
                            await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.updateTranslationsFree, user.user_id);
                        }
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    else if (queryResults.length === 0) {
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }
                    await dbConnectionObject.mysqlConnection?.commit();
                }
                catch (e) {
                    console.log("SQL ERROR, deleting premium users", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    refreshResponse.specificErrorCode = e.code;
                    reject(refreshResponse);
                }
                else {
                    refreshResponse.specificErrorCode = "Unknown error";
                    reject(refreshResponse);
                }
            }
        });
    }
    ;
}
;
exports.default = RefreshCounter;
//# sourceMappingURL=refresh.js.map