import UsersDatabase from "@shared/models/user_logins/users_db";
import * as appTypes from "@appTypes/appTypes"
import mysql, { RowDataPacket } from "mysql2/promise";
import preparedSQLStatements from "@shared/models/prepared_statements";
const UserDBPool = require("../../models/user_logins/users_db_pool");

class EmailVerificationChecker {

    static CheckUnverifiedEmails= (): Promise<appTypes.DBOperation>=>{

        return new Promise(async(resolve, reject)=>{

            const refreshResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Email Verification Check",
                specificErrorCode: "",
                resultArray: null
            };

            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

            try{

                //Get db connection

                const dbConnectionObject = await UsersDatabase.getUsersDBConnection();

                try{

                    await dbConnectionObject.mysqlConnection?.beginTransaction();
                
                    const [queryResults, ] = await dbConnectionObject.mysqlConnection.query<RowDataPacket[]>(
                        preparedSQLStatements.CRONQueries.getUnverifiedEmails,
                        currentTime
                    );

                    if (queryResults.length > 0) {

                        //Update email verifications and users in database
                        for(let user of queryResults){
                            const [deleteResult,] = await dbConnectionObject.mysqlConnection.query<RowDataPacket[]>(
                                preparedSQLStatements.CRONQueries.deleteUserByEmail, 
                                user.email
                            );

                            if(deleteResult.length === 0){
                                refreshResponse.specificErrorCode = "No rows affected"
                                reject(refreshResponse)
                            }
                        }
                        
                        refreshResponse.success = true;

                        resolve(refreshResponse);

                    } else if (queryResults.length === 0){

                        refreshResponse.success = true;
                        resolve(refreshResponse)
                    }

                    await dbConnectionObject.mysqlConnection?.commit();

                }catch(e){
                    console.log("SQL ERROR, updating email verification", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{

                    UserDBPool.releaseConnection(dbConnectionObject.mysqlConnection);

                }

            }catch(e){

                if (e.code){
                    refreshResponse.specificErrorCode = e.code;
                    reject(refreshResponse);
                }else{
                    refreshResponse.specificErrorCode = "Unknown error";
                    reject(refreshResponse);
                }
            }
        });
    }



};

export default EmailVerificationChecker;