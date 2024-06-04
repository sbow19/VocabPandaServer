"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const prepared_statements_1 = __importDefault(require("../prepared_statements"));
const UserSyncDBPool = require("./user_sync_pool");
class UserSyncDatabase extends models_template_1.default {
    /* Sync operations */
    /* SYNC Operations */
    static setSyncFlag = (userId, syncId, deviceId, setValue) => {
        return new Promise(async (resolve, reject) => {
            const setFlagResult = {
                success: false,
                operationType: "Set Sync Flag",
                specificErrorCode: "", //We need to indicate here what type of error occured
                resultArray: null
            };
            let value;
            if (setValue) {
                value = 1;
            }
            else if (!setValue) {
                value = 0;
            }
            ;
            try {
                //Get db connection
                const dbResponseObject = await super.getUserSyncDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.syncStatements.setSyncFlag, [
                        value,
                        syncId,
                        userId,
                        deviceId
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        setFlagResult.specificErrorCode = "No rows affected";
                        reject(setFlagResult);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        setFlagResult.success = true;
                        resolve(setFlagResult);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, setting sync flag", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserSyncDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    setFlagResult.specificErrorCode = e.code;
                    reject(setFlagResult);
                }
                else {
                    setFlagResult.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
    static checkSyncFlags = (userId, syncIds, deviceId) => {
        return new Promise(async (resolve, reject) => {
            const syncFlagCheckResult = {
                success: false,
                operationType: "Set Sync Flag",
                specificErrorCode: "", //We need to indicate here what type of error occured
                resultArray: null,
                fullSyncRequired: false
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUserSyncDBConnection();
                try {
                    const [queryResponse,] = await dbResponseObject.mysqlConnection.query(prepared_statements_1.default.syncStatements.checkUserSyncFlag, [
                        userId,
                        deviceId
                    ]);
                    //Check affected rows
                    if (queryResponse.length === 0) {
                        //No user found
                        syncFlagCheckResult.fullSyncRequired = false;
                        reject(syncFlagCheckResult);
                    }
                    else if (queryResponse.length === 1) {
                        //User found Check whether the sync flag is active
                        if (queryResponse.full_sync_flag === 1) {
                            //Full sync flag active, check whether sync ids match
                            for (let syncId of syncIds) {
                                if (syncId === queryResponse.sync_id) {
                                    //User device has successfully synced with backend previously
                                    //Lower full sync flag
                                    await UserSyncDatabase.setSyncFlag(userId, syncId, deviceId, false);
                                    syncFlagCheckResult.success === true;
                                    resolve(syncFlagCheckResult);
                                    return;
                                }
                                else {
                                    //Continue
                                }
                            }
                            //User device has not completed full sync
                            syncFlagCheckResult.fullSyncRequired = true;
                            reject(syncFlagCheckResult);
                        }
                        else if (queryResponse.full_sync_flag === 0) {
                            //No full sync flag
                            syncFlagCheckResult.success === true;
                            resolve(syncFlagCheckResult);
                        }
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, checking  full sync flag", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserSyncDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    syncFlagCheckResult.specificErrorCode = e.code;
                    reject(syncFlagCheckResult);
                }
                else {
                    syncFlagCheckResult.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
}
exports.default = UserSyncDatabase;
//# sourceMappingURL=user_sync_db.js.map