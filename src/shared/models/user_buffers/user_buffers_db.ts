import * as appTypes from "@appTypes/appTypes"
import * as mysqlTypes from "mysql2"
import vpModel from "@shared/models/models_template";
const {v4: uuidv4 } = require('uuid');
const strftime = require('strftime');
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
    static fetchBufferContent = (deviceType: string, userId: string): Promise<Array<any>>=>{
        return new Promise(async (resolve, reject)=>{

            const bufferOperationResponse: appTypes.BufferOperationResponse<Array<any>>= {

                message: "operation unsuccessful",
                operationType: "get",
                contentType: "buffer",
                success: false,
                customResponse: []
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

                    //Begin transaction

                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                     const [searchResult] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.bufferStatements.fetchBufferContent,
                        [
                            table,
                            userId
                        ]
                    )

                    await dbResponseObject.mysqlConnection?.commit(); 

                    const bufferContentRaw = searchResult[0];
                   
                    const bufferContent: Array<any> = await JSON.parse(bufferContentRaw);

                    bufferOperationResponse.message = "operation successful";
                    bufferOperationResponse.success = true;
                    bufferOperationResponse.customResponse = bufferContent;
                    resolve(bufferContent);

                  
                
                }catch(e){
                    throw e
                }finally{
                    UserBuffersDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                console.log(e);
                bufferOperationResponse.error = e;
                reject(bufferOperationResponse);
            }




        })
    }

   
}

export default UserBuffersDatabase;