"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const prepared_statements_1 = __importDefault(require("@shared/models/prepared_statements"));
const UserDBPool = require("../../models/user_logins/users_db_pool");
class EmailVerificationChecker {
    static CheckUnverifiedEmails = () => {
        return new Promise(async (resolve, reject) => {
            const refreshResponse = {
                success: false,
                operationType: "Email Verification Check",
                specificErrorCode: "",
                resultArray: null
            };
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            try {
                //Get db connection
                const dbConnectionObject = await users_db_1.default.getUsersDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection?.beginTransaction();
                    const [queryResults,] = await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.getUnverifiedEmails, currentTime);
                    if (queryResults.length > 0) {
                        //Update email verifications and users in database
                        for (let user of queryResults) {
                            const [deleteResult,] = await dbConnectionObject.mysqlConnection.query(prepared_statements_1.default.CRONQueries.deleteUserByEmail, user.email);
                            if (deleteResult.length === 0) {
                                refreshResponse.specificErrorCode = "No rows affected";
                                reject(refreshResponse);
                            }
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
                    console.log("SQL ERROR, updating email verification", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
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
    };
}
;
exports.default = EmailVerificationChecker;
//# sourceMappingURL=email_verification.js.map