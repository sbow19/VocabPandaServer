import * as appTypes from "@appTypes/appTypes"
import * as mysqlTypes from "mysql2"
import vpModel from "@shared/models/models_template";
const {v4: uuidv4 } = require('uuid');
const strftime = require('strftime');
const UserContentDBPool = require("./user_content_pool");
import preparedSQLStatements from "../prepared_statements";

class UsersContentDatabase extends vpModel {

    static addNewProject(newProjectDetails: appTypes.NewProjectDetails, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>{
    
        return new Promise(async(resolve, reject)=>{

            const dbAddResponseObject: appTypes.EntryAPIResponse = {

                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "project"
            };

            try{

                //get user id 
                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                
                try{

                    //Begin transaction

                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Add new user details

                    const addProjectSqlQuery =  `INSERT INTO projects VALUES (?, ?, ?, ?);` //user_id, project, target_lang, output_lang

                    await dbResponseObject.mysqlConnection?.query(
                        addProjectSqlQuery,
                        [
                            userId,
                            newProjectDetails.projectName,
                            newProjectDetails.target_lang,
                            newProjectDetails.output_lang
                            
                        ])

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                    dbAddResponseObject.responseMessage = "Add successful";
                    dbAddResponseObject.responseCode = 0;
                    dbAddResponseObject.addMessage = "New project added successfully"
                    dbAddResponseObject.addType = "project"

                    resolve(dbAddResponseObject)

                }catch(e){
                    throw e
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
        
            }catch(e){
                reject({e, dbAddResponseObject});
            }

        })
    }

    static deleteProject(projectName: string, username: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const dbDeleteResponseObject: appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig> = {

                responseCode: 0,
                responseMessage: "Delete unsuccessful",
                deleteMessage: "",
                deleteType: "project"
            };

            try{

                //get user id 

                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

                //Get db connection

                const dbResponseObject = await super.getUsersContentDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Add new user details
                    const addProjectSqlQuery =

                    `DELETE FROM projects WHERE
                        user_id = ?
                    AND 
                        project =?
                    ;` 

                    let [queryResponse] = await dbResponseObject.mysqlConnection?.query(
                        addProjectSqlQuery,
                        [
                            userId,
                            projectName
                        ])
                    
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    if(queryResponse.affectedRows===0){

                        dbDeleteResponseObject.deleteMessage = "No rows affected"

                        reject(dbDeleteResponseObject);
                        return

                    } else if (queryResponse.affectedRows>0){

                        dbDeleteResponseObject.responseMessage = "Delete successful";
                        dbDeleteResponseObject.responseCode = 0;
                        dbDeleteResponseObject.deleteMessage = "Project deleted successfully"
                        dbDeleteResponseObject.deleteType = "project"

                        resolve(dbDeleteResponseObject)
                    }

                }catch(e){
                    throw e
                }finally{
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                reject({e, dbDeleteResponseObject});

            }

        })
    }

    static addNewEntry(newEntryObject: appTypes.EntryDetails): Promise<appTypes.APIEntryResponse>{

        return new Promise(async(resolve, reject)=>{

            const addEntryResponseObject: appTypes.APIEntryResponse={

                message: "operation unsuccessful",
                success: false,
                operationType: "create",
                contentType: "entry"
            }

            try{

                //Generate entry id
                const entryId = uuidv4();

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                try{

                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Add new user details
                   

                    await dbResponseObject.mysqlConnection?.query(
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

                    //add tags query

                    if(newEntryObject.tags === 1){
                        for(let tagId of newEntryObject.tagsArray){

                            await dbResponseObject.mysqlConnection?.query(
                                preparedSQLStatements.entryStatements.addEntryTags,
                                [
                                    tagId,
                                    entryId
                                ]
                            )
                        }
                    }                

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                    addEntryResponseObject.message = "operation successful";
                    addEntryResponseObject.success = true;

                    resolve(addEntryResponseObject)
            

                }catch(e){
                    throw e
                }finally{

                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }catch(e){

                addEntryResponseObject.error = e;

                reject(addEntryResponseObject);

            }
        })
    }

    static updateEntry(updateEntryObject: appTypes.EntryDetails): Promise<appTypes.APIEntryResponse>{

        return new Promise(async(resolve, reject)=>{

            const updateEntryResponseObject: appTypes.APIEntryResponse={

                message: "operation unsuccessful",
                success: false,
                operationType: "update",
                contentType: "entry"
            }

            try{

                //Get db connection

                const dbResponseObject = await super.getUsersContentDBConnection();

                try{

                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.entryStatements.updateEntry,
                        [
                            updateEntryObject.targetLanguageText,
                            updateEntryObject.targetLanguage,
                            updateEntryObject.outputLanguageText,
                            updateEntryObject.outputLanguage,
                            updateEntryObject.tags,
                            updateEntryObject.createdAt
                        ])


                    //update tags query

                    if(updateEntryObject.tags === 1){

                        // Remove all tags associated with entry_id, and then  re add them.
                        await dbResponseObject.mysqlConnection?.query(
                            preparedSQLStatements.entryStatements.removeEntryTags,
                            [updateEntryObject.entryId]
                        )

                        for(let tagId of updateEntryObject.tagsArray){

                            await dbResponseObject.mysqlConnection?.query(
                                preparedSQLStatements.entryStatements.addEntryTags,
                                [
                                    tagId,
                                    updateEntryObject.entryId
                                ]
                            )
                        }
                    };           

                    await dbResponseObject.mysqlConnection?.commit(); // commit update entry transaction

                    updateEntryResponseObject.message = "operation successful";
                    updateEntryResponseObject.success = true;

                    resolve(updateEntryResponseObject);

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                updateEntryResponseObject.error = e;

                reject(updateEntryResponseObject);

            }
        })
    }

    static deleteEntry(entryId: string): Promise<appTypes.APIEntryResponse>{

        return new Promise(async(resolve, reject)=>{

            const deleteEntryResponseObject: appTypes.APIEntryResponse={

                message: "operation unsuccessful",
                success: false,
                operationType: "remove",
                contentType: "entry"
            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                try{
                     //Begin transaction  
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
                    
                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.entryStatements.deleteEntry, 
                        entryId
                    )

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                    if(queryResponse.affectedRows === 0){

                        deleteEntryResponseObject.message = "operation unsuccessful"

                        throw(deleteEntryResponseObject);

                    } else if (queryResponse.affectedRows>0){

                        deleteEntryResponseObject.message ="operation successful"

                        resolve(deleteEntryResponseObject)
                    }

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }catch(e){
                deleteEntryResponseObject.error = e;
                reject(deleteEntryResponseObject);
            }
        })
    }

    static addTag(tagName: string, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const addTagResponseObject: appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>={

                responseCode: 0,
                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "tag"
            }

            try{

                //get user id 
                const {matchMessage} = await super.getUserId(username);
            
                const userId = matchMessage;

                //Generate tag id
                const tagId = uuidv4();

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                try{

                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Add new tag details
                    const addNewEntrySqlQuery =

                    `INSERT INTO user_tags VALUES (?, ?, ?);`
                    /*
                        user_id
                        tag_name
                        tag_id
                    */ 

                    await dbResponseObject.mysqlConnection?.query(
                        addNewEntrySqlQuery,
                        [
                            userId,
                            tagName,
                            tagId
                        ])

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                    addTagResponseObject.responseMessage = "Add successful";
                    addTagResponseObject.responseCode = 0;
                    addTagResponseObject.addMessage = "New tag added successfully"
                    addTagResponseObject.addType = "tag"

                    resolve(addTagResponseObject)

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }catch(e){

                reject({e, addTagResponseObject});

            }
        })
    }

    static deleteTag(tagId: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const deleteTagResponseObject: appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>={

                responseCode: 0,
                responseMessage: "Delete unsuccessful",
                deleteMessage: "",
                deleteType: "tag"
            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Add new user details
                    const deleteEntrySqlQuery = `DELETE FROM user_tags WHERE tag_id = ?;`;
                    
                    let [queryResponse] = await dbResponseObject.mysqlConnection?.query(deleteEntrySqlQuery, tagId)

                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                    if(queryResponse.affectedRows===0){

                        deleteTagResponseObject.deleteMessage = "No rows affected"

                        reject(deleteTagResponseObject);
                        return

                    } else if (queryResponse.affectedRows>0){

                        deleteTagResponseObject.responseMessage = "Delete successful";
                        deleteTagResponseObject.responseCode = 0;
                        deleteTagResponseObject.deleteMessage = "Tag deleted successfully"
                        deleteTagResponseObject.deleteType = "tag"

                        resolve(deleteTagResponseObject)
                    }

                }catch(e){
                    throw e
                }finally{
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
                
            }catch(e){
                reject({e, deleteEntryResponseObject});
            }
        })
    }

    static requestTranslation(userRequest:appTypes.userRequest, username: string): Promise<appTypes.TranslationResponseObject<appTypes.TranslationResponseConfig>>{
        return new Promise(async (resolve, reject)=>{

            const translationResponseObject: appTypes.TranslationResponseObject<appTypes.TranslationResponseConfig> = {
                responseCode: 0,
                responseMessage: "Translation unsuccessful",
                translationMessage: ""
            }

            try{

                //get user id 

                const {matchMessage} = await super.getUserId(username);
                
                const userId = matchMessage;

            }catch(e){

            }




        })
    }
}

export default UsersContentDatabase;