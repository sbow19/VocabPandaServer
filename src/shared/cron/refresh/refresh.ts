import UserDetailsDatabase from "@shared/models/user_details/user_details_db";
import * as appTypes from "@appTypes/appTypes"
const UserDetailsDBPool = require("../../models/user_details/user_details_pool");
import mysql, {ResultSetHeader, RowDataPacket} from 'mysql2/promise'
import preparedSQLStatements from "@shared/models/prepared_statements";

class RefreshCounter {


    static playsRefreshChecker(): Promise<appTypes.DBOperation>{
        return new Promise(async(resolve, reject)=>{

            const refreshResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Plays Refresh Check",
                specificErrorCode: "",
                resultArray: null
            };

            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
            try{

                const dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                try{

                    await dbConnectionObject.mysqlConnection?.beginTransaction();

                    const [queryResults, ] = await dbConnectionObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.CRONQueries.checkPlaysRefresh, 
                        currentTime
                    )
                    
                    if (queryResults.length > 0) {
                        //Update next refresh timer
                        for(let user of queryResults){
                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.CRONQueries.updatePlaysRefresh, 
                                [
                                    user.user_id
                                ]
                            )
                        }

                        //Update plays left table
                        for(let user of queryResults){
                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.CRONQueries.updatePlaysLeft, 
                                [
                                    user.user_id
                                ]
                            )
                        }

                        

                        refreshResponse.success = true;
                        resolve(refreshResponse);

                    } else if (queryResults.length === 0){

                        refreshResponse.success = true;
                        resolve(refreshResponse)
                        
                    }


                    await dbConnectionObject.mysqlConnection?.commit();
                   
                    
                }catch(e){
                    console.log("SQL ERROR, updating plays refresh", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                } finally{

                   UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
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

        })

    };

    static translationsRefreshChecker():  Promise<appTypes.DBOperation>{

        return new Promise(async(resolve, reject)=>{

            const refreshResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Translations Refresh Check",
                specificErrorCode: "",
                resultArray: null
            };

            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    
            try{

                const dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                try{

                    await dbConnectionObject.mysqlConnection.beginTransaction();
    
                    const [queryResults, ] = await dbConnectionObject.mysqlConnection.query<RowDataPacket[]>(
                        preparedSQLStatements.CRONQueries.checkTranslationsRefresh, 
                        currentTime
                    )
                    
    
                    if (queryResults.length > 0) {
    
                        //Update refresh timer
                        for(let user of queryResults){
    
    
                            await dbConnectionObject.mysqlConnection.query(
                                preparedSQLStatements.CRONQueries.updateTranslationsRefresh, 
                                user.user_id
                            )
                        }
    
                        //Update translations left
                        for(let user of queryResults){

                            //Check if user is premium or not
                            const [premiumQueryResult,] = await dbConnectionObject.mysqlConnection.query<RowDataPacket[]>(
                                preparedSQLStatements.CRONQueries.getPremiumStatus,
                                user.user_id
                            );
    
                            if(premiumQueryResult[0].premium === 1){
                                await dbConnectionObject.mysqlConnection?.query(
                                    preparedSQLStatements.CRONQueries.updateTranslationsPremium, 
                                    user.user_id
                                )
    
                            } else if (premiumQueryResult[0].premium === 0){
                                await dbConnectionObject.mysqlConnection?.query(
                                    preparedSQLStatements.CRONQueries.updateTranslationsFree, 
                                    user.user_id
                                )
                            }
                        };
    
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    } else if (queryResults.length === 0){
    
                        refreshResponse.success = true;
                        resolve(refreshResponse);
                    }

                    await dbConnectionObject.mysqlConnection?.commit();

                }catch(e){
                    console.log("SQL ERROR, updating translations left", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);
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

        })


    };

    static premiumUserChecker():  Promise<appTypes.DBOperation>{

        return new Promise(async(resolve, reject)=>{

            const refreshResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Premium User Check",
                specificErrorCode: "",
                resultArray: null
            };

            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
            try{

                const dbConnectionObject = await UserDetailsDatabase.getUsersDetailsDBConnection();

                try{

                    await dbConnectionObject.mysqlConnection?.beginTransaction();
            
                    const [queryResults,] = await dbConnectionObject.mysqlConnection.query<RowDataPacket[]>(
                        preparedSQLStatements.CRONQueries.checkPremiumUsers, 
                        currentTime
                    )
                    
                    if (queryResults.length > 0) {

                        //Delete premium user
                        for(let user of queryResults){
                            await dbConnectionObject.mysqlConnection?.query(
                                preparedSQLStatements.CRONQueries.deletePremiumUser, 
                                user.user_id
                            );
                        }

                        //Update plays left table
                        for(let user of queryResults){
                            await dbConnectionObject.mysqlConnection.query(
                                preparedSQLStatements.CRONQueries.updatePlaysLeft, 
                                user.user_id
                            )                            
                        }

                        //update translations left
                        for(let user of queryResults){

                            await dbConnectionObject.mysqlConnection.query(
                                preparedSQLStatements.CRONQueries.updateTranslationsFree, 
                                user.user_id
                            )
                        }

                        refreshResponse.success = true;
                        resolve(refreshResponse)

                    } else if (queryResults.length === 0){

                        refreshResponse.success = true;
                        resolve(refreshResponse)
                    
                    }

                    await dbConnectionObject.mysqlConnection?.commit();

                }catch(e){
                    console.log("SQL ERROR, deleting premium users", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{

                    UserDetailsDBPool.releaseConnection(dbConnectionObject.mysqlConnection);

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

        })


    };
    


};

export default RefreshCounter;