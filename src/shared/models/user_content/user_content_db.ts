import * as appTypes from "@appTypes/appTypes"
import * as apiTypes from '@appTypes/api'
import vpModel from "@shared/models/models_template";;
const UserContentDBPool = require("./user_content_pool");
import preparedSQLStatements from "../prepared_statements";
import UserDetailsDatabase from "../user_details/user_details_db";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";

class UsersContentDatabase extends vpModel {

    /* Sync Operations */
    static pushLocalContent = (userContentArray: apiTypes.OperationWrapper[]): Promise<appTypes.PushLocalContentResult> =>{
        return new Promise(async (resolve, reject)=>{

            const pushLocalContentResult: appTypes.PushLocalContentResult = {
                success: false,
                operationType: "Push local content db",
                dbError: "" //We need to indicate here what type of error occured
            };

            try{
                //Cycle through user data array and add to db sequentially
                for(let userData of userContentArray){

                    switch(userData.dataType){
                        case "project":
                            //Conduct project operation
                            if(userData.operationType === "create"){
                                await this.addNewProject(userData.userData as apiTypes.ProjectDetails)
                            }else if(userData.operationType === "remove"){
                                await this.deleteProject(userData.userData as apiTypes.ProjectDetails)
                            } 

                            //Add update project later with extension

                            break;
                        case "entry":
                            //Conduct entry operation
                            if(userData.operationType === "create"){
                                await this.addNewEntry(userData.userData as apiTypes.EntryDetails)
                            } else if (userData.operationType === "remove"){
                                await this.deleteEntry(userData.userData as apiTypes.EntryDetails)
                            }else if (userData.operationType === "update"){
                                await this.updateEntry(userData.userData as apiTypes.EntryDetails)
                            }
                            break;

                        case "settings":
                            //Conduct settings change operation
                            if(userData.operationType === "update"){
                                await UserDetailsDatabase.updateUserSettings(userData.userData as apiTypes.UserSettings)
                            }
                            break;

                        case "plays":
                            //Conduct plays update
                            if(userData.operationType === "update"){
                                await UserDetailsDatabase.updatePlaysLeft(userData.userData as apiTypes.PlaysDetails)
                            }
                            break;
                        case "tags":
                            break;
                        default: 
                            break

                    }
                }

                //Assuming no errors were thrown, then we simply resolve the push local sync response
                pushLocalContentResult.success = true;
                resolve(pushLocalContentResult);

            }catch(e){

                if(e.code){
                    //Determine if it's a mysql error, as it will have a code
                    //Catch some error 
                    const DBError = e as appTypes.DBOperation;

                    /* DETERMINE WHAT TYPE OF ERROR */
                    pushLocalContentResult.dbError = DBError.specificErrorCode;

                    reject(pushLocalContentResult);
                }else{
                    pushLocalContentResult.dbError = "Unknown error"
                    reject(pushLocalContentResult);
                }

            }

        })
    }

    static getAllContent = (userId: string): Promise<appTypes.DBOperation<apiTypes.BackendContent>>=>{
        return new Promise(async (resolve, reject)=>{

            const getAllContentResponse: appTypes.DBOperation<apiTypes.BackendContent>= {
                success: false,
                operationType: "Fetch All Content",
                specificErrorCode: "", //We need to indicate here what type of error occured
                resultArray: {
                    projects: [],
                    entries: [],
                    tags: []
                }
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                try{

                    const [projects, ] = await dbResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.projectStatements.getAllProjects,
                        [
                            userId
                            
                    ])

                    const [entries, ] = await dbResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.entryStatements.getAllEntries,
                        [
                            userId
                        ]
                    )
                    
                    getAllContentResponse.resultArray.entries = entries;
                    getAllContentResponse.resultArray.projects = projects;

                    resolve(getAllContentResponse);

                }catch(e){
                    console.log("SQL ERROR, fetching user content", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
        
            }catch(e){
                if(e.code){
                    //If an error code exists
                    getAllContentResponse.specificErrorCode = e.code;
                    reject(getAllContentResponse);
                }else{
                    getAllContentResponse.specificErrorCode = "Unknown error"
                    reject(getAllContentResponse);
                }
            }

        })
    }

    
    static addNewProject = (newProjectDetails: apiTypes.ProjectDetails): Promise<appTypes.DBOperation> =>{
        return new Promise(async(resolve, reject)=>{

            const projectAddResponse: appTypes.DBOperation = {
                success: false,
                specificErrorCode: "",
                operationType: "DB Project Operation"
            };


            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                //Begin transaction
                await dbResponseObject.mysqlConnection?.beginTransaction();

                try{


                    const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.projectStatements.addNewProject,
                        [
                            newProjectDetails.userId,
                            newProjectDetails.projectName,
                            newProjectDetails.targetLanguage,
                            newProjectDetails.outputLanguage
                            
                        ])

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    //Check affected rows
                    if(queryResponse.affectedRows === 0){
                        //No rows affected
                        projectAddResponse.specificErrorCode = "No rows affected";
                        reject(projectAddResponse);

                    } else if (queryResponse.affectedRows > 0){
                        projectAddResponse.success = true;
                        resolve(projectAddResponse);
                    }

                }catch(e){
                    dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, inserting project", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
        
            }catch(e){
                if(e.code){
                    //If an error code exists
                    projectAddResponse.specificErrorCode = e.code;
                    reject(projectAddResponse);
                }else{
                    projectAddResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }
            }

        })
    }

    static deleteProject = (deleteProjectDetails: apiTypes.ProjectDetails): Promise<appTypes.DBOperation> =>{

        return new Promise(async(resolve, reject)=>{

            const projectDeleteResponse: appTypes.DBOperation = {

                success: false,
                operationType: "DB Plays Operation",
                specificErrorCode: ""
            };

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                //Begin transaction
                await dbResponseObject.mysqlConnection?.beginTransaction();

                try{
                    

                    const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.projectStatements.deleteProject,
                        [
                            deleteProjectDetails.userId,
                            deleteProjectDetails.projectName
                        ])
                    
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    if(queryResponse.affectedRows===0){

                        projectDeleteResponse.specificErrorCode = "No rows affected";
                        reject(projectDeleteResponse);

                    } else if (queryResponse.affectedRows === 1){

                        projectDeleteResponse.success = true;
                        resolve(projectDeleteResponse)
                    }

                }catch(e){
                    dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, deleting project", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){
                if(e.code){
                    //If an error code exists
                    projectDeleteResponse.specificErrorCode = e.code;
                    reject(projectDeleteResponse);
                }else{
                    projectDeleteResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }

            }

        })
    }

    static addNewEntry = (newEntryObject: apiTypes.EntryDetails): Promise<appTypes.DBOperation>=>{

        return new Promise(async(resolve, reject)=>{

            const addEntryResponse: appTypes.DBOperation={
                success: false,
                operationType: "DB Entry Operation",
                specificErrorCode: ""
            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                //Begin transaction
                await dbResponseObject.mysqlConnection?.beginTransaction();

                try{
                    //Add new user details
                   
                    const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.entryStatements.addNewEntry,
                        [
                            newEntryObject.userId,
                            newEntryObject.username,
                            newEntryObject.entryId,
                            newEntryObject.targetLanguageText,
                            newEntryObject.targetLanguage,
                            newEntryObject.outputLanguageText,
                            newEntryObject.outputLanguage,
                            newEntryObject.tags, 
                            newEntryObject.createdAt,
                            newEntryObject.updatedAt,
                            newEntryObject.project
                        ])               

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                     //Check affected rows
                     if(queryResponse.affectedRows === 0){
                        //No rows affected
                        addEntryResponse.specificErrorCode = "No rows affected";
                        reject(addEntryResponse);

                    } else if (queryResponse.affectedRows > 0){
                        addEntryResponse.success = true;
                        resolve(addEntryResponse);
                    }
            

                }catch(e){
                    dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, inserting entry", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{

                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                if(e.code){
                    //If an error code exists
                    addEntryResponse.specificErrorCode = e.code;
                    reject(addEntryResponse);
                }else{
                    projectAddResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }

            }
        })
    }

    static updateEntry = (updateEntryObject: apiTypes.EntryDetails): Promise<appTypes.DBOperation>=>{

        return new Promise(async(resolve, reject)=>{

            const updateEntryResponse: appTypes.DBOperation={
               success: false,
               operationType: "DB Entry Operation",
               specificErrorCode: ""
            }

            try{

                //Get db connection

                const dbResponseObject = await super.getUsersContentDBConnection();
                dbResponseObject.mysqlConnection?.beginTransaction()

                try{

                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.entryStatements.updateEntry,
                        [
                            updateEntryObject.targetLanguageText,
                            updateEntryObject.targetLanguage,
                            updateEntryObject.outputLanguageText,
                            updateEntryObject.outputLanguage,
                            updateEntryObject.tags,
                            updateEntryObject.updatedAt,
                            updateEntryObject.entryId
                        ]
                    )           

                    await dbResponseObject.mysqlConnection?.commit(); // commit update entry transaction

                    //Check affected rows
                    if(queryResponse.affectedRows === 0){
                        //No rows affected
                        updateEntryResponse.specificErrorCode = "No rows affected";
                        reject(updateEntryResponse);

                    } else if (queryResponse.affectedRows > 0){
                        updateEntryResponse.success = true;
                        resolve(updateEntryResponse);
                    }

                }catch(e){
                    dbResponseObject.mysqlConnection?.rollback();
                    console.log("SQL ERROR, updating entry", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                if(e.code){
                    //If an error code exists
                    updateEntryResponse.specificErrorCode = e.code;
                    reject(updateEntryResponse);
                }else{
                    updateEntryResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }

            }
        })
    }

    static deleteEntry = (entryObject: apiTypes.EntryDetails): Promise<appTypes.DBOperation> =>{

        return new Promise(async(resolve, reject)=>{

            const deleteEntryResponse: appTypes.DBOperation={
               
                success: false,
                operationType: "DB Entry Operation",
                specificErrorCode: ""
                
            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                //Begin transaction  
                await dbResponseObject.mysqlConnection?.beginTransaction();

                try{
             
                    
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.entryStatements.deleteEntry, 
                        entryObject.entryId
                    )

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction


                    //Check affected rows
                    if(queryResponse.affectedRows === 0){
                        //No rows affected
                        deleteEntryResponse.specificErrorCode = "No rows affected";
                        reject(deleteEntryResponse);

                    } else if (queryResponse.affectedRows > 0){
                        deleteEntryResponse.success = true;
                        resolve(deleteEntryResponse);
                    }
                    

                }catch(e){
                    await dbResponseObject.mysqlConnection?.rollback()
                    console.log("SQL ERROR, updating entry", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }catch(e){
                if(e.code){
                    //If an error code exists
                    deleteEntryResponse.specificErrorCode = e.code;
                    reject(deleteEntryResponse);
                }else{
                    deleteEntryResponse.specificErrorCode = "Unknown error"
                    reject(e);
                }
            }
        })
    }

   
}

export default UsersContentDatabase;