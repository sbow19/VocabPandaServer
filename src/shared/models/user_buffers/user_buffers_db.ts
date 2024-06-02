import * as appTypes from "@appTypes/appTypes"
import * as mysqlTypes from "mysql2"
import * as apiTypes from '@appTypes/api'
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import vpModel from "@shared/models/models_template";
const UserBuffersDBPool = require("./user_buffers_pool");
import preparedSQLStatements from "../prepared_statements";
const UserDBPool = require("./users_db_pool");

class UserBuffersDatabase extends vpModel {

    //Get no of device types
    static getNoOfUserDeviceTypes = (userId: string): Promise<appTypes.BufferOperationResponse<string>>=>{
        return new Promise(async(resolve, reject)=>{

            const bufferOperationResponse: appTypes.BufferOperationResponse<string> = {

                message: "operation unsuccessful",
                operationType: "create",
                contentType: "project",
                success: false,
                customResponse: ""
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersDBConnection();

                try{

                    //Begin transaction

                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                     const [searchResult] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.bufferStatements.checkForDeviceMatches,
                        [
                            userId
                        ])

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction


                    //Check whether there is more than one Device type

                    const appTypes = [];
                    const extensionTypes = [];
                    for(let result in searchResult){
                        if(result.deviceType === "app"){
                            appTypes.push(result);
                        }else if (result.deviceType === "extension"){
                            extensionTypes.push(result);
                        }
                    }

                    if (appTypes.length > 0 && extensionTypes.length > 0){

                        bufferOperationResponse.message = "operation successful";
                        bufferOperationResponse.success = true;
                        bufferOperationResponse.customResponse = "2 device types";
                        resolve(bufferOperationResponse);

                    } else {
                        //If app and extension, then return true.

                        bufferOperationResponse.message = "operation successful";
                        bufferOperationResponse.success = true;
                        bufferOperationResponse.customResponse = "less than 2 device types";
                        resolve(bufferOperationResponse);
                    }
                }catch(e){
                    throw e
                }finally{
                    UserDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                console.log(e);
                bufferOperationResponse.error = e;
                reject(bufferOperationResponse);
            }

        })
    };  

    //Fetch buffer content
    static fetchBufferContent = (deviceType: string, userId: string): Promise<appTypes.DBOperation<apiTypes.OperationWrapper[]>>=>{
        return new Promise(async (resolve, reject)=>{

            const bufferOperationResponse: appTypes.DBOperation<Array<apiTypes.OperationWrapper>>= {
                success: false,
                operationType: "Fetch Buffer",
                specificErrorCode: "",
                resultArray: []
            };

            let table;
            if(deviceType === "app"){
                table = "user_app_buffers";
            }else if (deviceType === "extension"){
                table = "user_extension_buffers";
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersBuffersDBConnection();

                try{

                    //Begin transaction

                    await dbResponseObject.mysqlConnection?.beginTransaction();

                     const [searchResult, ] = await dbResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.bufferStatements.fetchBufferContent,
                        [
                            table,
                            userId
                        ]
                    )

                    await dbResponseObject.mysqlConnection?.commit(); 
                   
                    const bufferContent: Array<apiTypes.OperationWrapper> = await JSON.parse(searchResult);

                    //Check affected rows
                    if(searchResult.length === 0){
                        //No rows affected
                        bufferOperationResponse.specificErrorCode = "No rows affected";
                        reject(bufferOperationResponse);

                    } else if (searchResult.length > 0){
                        bufferOperationResponse.success = true;
                        bufferOperationResponse.resultArray = bufferContent;
                        resolve(bufferOperationResponse);
                    }

                  
                
                }catch(e){
                    console.log("SQL ERROR, featching buffer", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserBuffersDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                if(e.code){
                    //If an error code exists
                    bufferOperationResponse.specificErrorCode = e.code;
                    reject(bufferOperationResponse);
                }else{
                    bufferOperationResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }
            }




        })
    }

    //Clear buffer content
    static clearBufferContent = (deviceType: string, userId: string): Promise<appTypes.DBOperation<apiTypes.OperationWrapper[]>>=>{
        return new Promise(async (resolve, reject)=>{

            const bufferOperationResponse: appTypes.DBOperation<Array<apiTypes.OperationWrapper>>= {
                success: false,
                operationType: "Clear buffer",
                specificErrorCode: "",
                resultArray: []
            };

            let table;
            if(deviceType === "app"){
                table = "user_app_buffers";
            }else if (deviceType === "extension"){
                table = "user_extension_buffers";
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersBuffersDBConnection();

                try{

                    //Begin transaction

                    await dbResponseObject.mysqlConnection?.beginTransaction();

                     const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.bufferStatements.clearBufferContent,
                        [
                            table,
                            userId
                        ]
                    )

                    await dbResponseObject.mysqlConnection?.commit(); 

                    //Check affected rows
                    if(queryResponse.rowsAffected === 0){
                        //No rows affected
                        bufferOperationResponse.specificErrorCode = "No rows affected";
                        reject(bufferOperationResponse);

                    } else if (queryResponse.rowsAffected > 1){
                        bufferOperationResponse.success = true;
                        resolve(bufferOperationResponse);
                    }

                  
                
                }catch(e){
                    console.log("SQL ERROR, clearing buffer", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserBuffersDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                if(e.code){
                    //If an error code exists
                    bufferOperationResponse.specificErrorCode = e.code;
                    reject(bufferOperationResponse);
                }else{
                    bufferOperationResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }
            }




        })
    }

    /* Sync Operations */
    static pushLocalContent = (userContentArray: apiTypes.OperationWrapper[], deviceType: string, userId: string): Promise<appTypes.PushLocalContentResult> =>{
        return new Promise(async (resolve, reject)=>{

            const pushLocalContentResult: appTypes.PushLocalContentResult = {
                success: false,
                operationType: "Push local content buffer",
                dbError: "" //We need to indicate here what type of error occured
            };

            let table;
            if(deviceType === "app"){
                table = "user_extension_buffers";
            }else if (deviceType === "extension"){
                table = "user_app_buffers";
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersBuffersDBConnection();
                
                try{

                    //Fetch buffer content
                    const bufferFetchResponse = await this.fetchBufferContent(deviceType, userId);

                    const bufferContent = bufferFetchResponse.resultArray;

                    bufferContent.push(...userContentArray); // Push contents of local content to extension buffer

                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();

                    const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.bufferStatements.pushLocalContent,
                        [
                            table,
                            JSON.stringify(bufferContent),
                            userId
                        ]
                    )

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    //Check affected rows
                    if(queryResponse.affectedRows === 0){
                        //No rows affected
                        pushLocalContentResult.dbError = "No rows affected";
                        reject(pushLocalContentResult);

                    } else if (queryResponse.affectedRows > 0){
                        pushLocalContentResult.success = true;
                        resolve(pushLocalContentResult);
                    }

                }catch(e){
                    console.log("SQL ERROR, pushing content to buffer", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
        
            }catch(e){
                if(e.code){
                    //If an error code exists
                    pushLocalContentResult.dbError = e.code;
                    reject(pushLocalContentResult);
                }else{
                    pushLocalContentResult.dbError = "Unknown error"
                    reject(e);
                }
            }

        })
    }

   
}

export default UserBuffersDatabase;