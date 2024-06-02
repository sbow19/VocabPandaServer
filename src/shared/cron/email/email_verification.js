"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const UserDBPool = require("../../models/user_logins/users_db_pool");
class EmailVerificationChecker {
    static CheckUnverifiedEmails() {
        return new Promise(async (resolve, reject) => {
            const emailVerificationResponse = {
                responseMessage: "Check complete",
                info: "",
                errorMessage: null
            };
            try {
                //Get db connection
                const dbConnectionObject = await users_db_1.default.getUsersDBConnection();
                try {
                    await dbConnectionObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    const checkUnverifiedEmailsSqlQuery = 'SELECT * FROM verification WHERE token_expiry < ?;';
                    const [queryResults] = await dbConnectionObject.mysqlConnection?.query(checkUnverifiedEmailsSqlQuery, currentTime);
                    if (queryResults.length > 0) {
                        //Update email verifications and users in database
                        for (let user of queryResults) {
                            const email = user.email;
                            const updateAPIKeyQuery = `

                                UPDATE api_keys
                                SET user_id = null
                                WHERE user_id = (

                                    SELECT id 
                                    FROM users
                                    WHERE email = ?

                                );
                            `;
                            await dbConnectionObject.mysqlConnection?.query(updateAPIKeyQuery, email, (e) => {
                                console.log(e);
                            });
                            const deleteUserQuery = `

                                DELETE FROM users
                                WHERE email = ?
                                ;

                            `;
                            await dbConnectionObject.mysqlConnection?.query(deleteUserQuery, email);
                            const deleteEmailVerificationQuery = `

                                DELETE FROM verification
                                WHERE email = ?
                                ;
                            `;
                            await dbConnectionObject.mysqlConnection?.query(deleteEmailVerificationQuery, email);
                        }
                        emailVerificationResponse.responseMessage = "Check complete";
                        emailVerificationResponse.info = {
                            queryResults: queryResults,
                            time: currentTime
                        };
                        resolve(emailVerificationResponse);
                    }
                    else if (queryResults.length === 0) {
                        emailVerificationResponse.responseMessage = "Check complete";
                        emailVerificationResponse.info = "No changes required.";
                        console.log('No matches found at', currentTime);
                        resolve(emailVerificationResponse);
                    }
                    await dbConnectionObject.mysqlConnection?.commit();
                }
                catch (e) {
                    throw e;
                }
                finally {
                    UserDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
                }
            }
            catch (err) {
                emailVerificationResponse.errorMessage = err;
                emailVerificationResponse.responseMessage = "Check unsuccessful";
                const EmailVerificationError = new Error("Unable to check unverified emails.");
                EmailVerificationError.cause = {
                    err,
                    emailVerificationResponse
                };
                reject(EmailVerificationError);
            }
        });
    }
}
;
exports.default = EmailVerificationChecker;
//# sourceMappingURL=email_verification.js.map