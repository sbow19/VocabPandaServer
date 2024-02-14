import * as appTypes from "@appTypes/appTypes"
import * as mysqlTypes from "mysql2"
import vpModel from "@shared/models/models_template";
const {v4: uuidv4 } = require('uuid');
const strftime = require('strftime');

class UsersContentDatabase extends vpModel {

    static addNewProject(newProjectDetails: appTypes.NewProjectDetails, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const dbAddResponseObject: appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig> = {

                responseCode: 0,
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

                reject({e, dbAddResponseObject});

            }

        })
    }

    //TODO - finish update project

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

                reject({e, dbDeleteResponseObject});

            }

        })
    }

    static addNewEntry(newEntryObject: appTypes.NewEntryDetails, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const addEntryResponseObject: appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>={

                responseCode: 0,
                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "entry"
            }

            try{

                  //get user id 

                  const {matchMessage} = await super.getUserId(username);
                
                  const userId = matchMessage;

                  //Check whether  tags  provided

                  let tags = 0;

                  if (newEntryObject.tags.length > 0){

                    tags = 1; //Tags provided
                  };
  
                  //Generate entry id
  
                  const entryId = uuidv4();
  
                  //Get db connection
  
                  const dbResponseObject = await super.getUsersContentDBConnection();
  
                 //Begin transaction
  
                  await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
  
                  //Add new user details
  
                  const addNewEntrySqlQuery =
  
                  `INSERT INTO user_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, DEFAULT, DEFAULT, ?);`
                  /*
                      user_id
                      username
                      entry_id
                      target_language_text
                      target_language
                      output_language_text
                      output_language
                      tags
                      created_at
                      updated_at
                      project
                  */ 

                await dbResponseObject.mysqlConnection?.query(
                    addNewEntrySqlQuery,
                    [
                        userId,
                        username,
                        entryId,
                        newEntryObject.target_language_text,
                        newEntryObject.target_language,
                        newEntryObject.output_language_text,
                        newEntryObject.output_language,
                        tags, 
                        newEntryObject.project
                    ])

                await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
                //add tags query

                const insertTagDetailsSqlQuery = `INSERT INTO entry_tags VALUES (?, ?)` //tag_id, entry_id

                if(tags>0){
                    for(let tagId of newEntryObject.tags){

                        await dbResponseObject.mysqlConnection?.query(
                            insertTagDetailsSqlQuery,
                            [
                                tagId,
                                entryId
                            ]
                        )
                    }
                }                

                await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                addEntryResponseObject.responseMessage = "Add successful";
                addEntryResponseObject.responseCode = 0;
                addEntryResponseObject.addMessage = "New entry added successfully"
                addEntryResponseObject.addType = "entry"

                resolve(addEntryResponseObject)
        

            }catch(e){

                reject({e, addEntryResponseObject});

            }
        })
    }

    //TODO - finish update entry

    static updateEntry(updateObject: appTypes.NewEntryDetails, username: string, entryId: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const updateEntryResponseObject: appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>={

                responseCode: 0,
                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "entry"
            }

            try{

                  //get user id 

                  const {matchMessage} = await super.getUserId(username);
                
                  const userId = matchMessage;

                  //Check whether  tags  provided

                  let tags = 0;

                  if (updateObject.tags.length > 0){

                    tags = 1; //Tags provided
                  };
  
  
                  //Get db connection
  
                  const dbResponseObject = await super.getUsersContentDBConnection();
  
                 //Begin transaction
  
                  await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
  
                  //Add new user details
  
                  const addNewEntrySqlQuery =
  
                  `INSERT INTO user_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, DEFAULT, DEFAULT, ?);`
                  /*
                      user_id
                      username
                      entry_id
                      target_language_text
                      target_language
                      output_language_text
                      output_language
                      tags
                      created_at
                      updated_at
                      project
                  */ 

                await dbResponseObject.mysqlConnection?.query(
                    addNewEntrySqlQuery,
                    [
                        userId,
                        username,
                        entryId,
                        newEntryObject.target_language_text,
                        newEntryObject.target_language,
                        newEntryObject.output_language_text,
                        newEntryObject.output_language,
                        tags, 
                        newEntryObject.project
                    ])

                await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
                //add tags query

                const insertTagDetailsSqlQuery = `INSERT INTO entry_tags VALUES (?, ?)` //tag_id, entry_id

                if(tags>0){
                    for(let tagId of newEntryObject.tags){

                        await dbResponseObject.mysqlConnection?.query(
                            insertTagDetailsSqlQuery,
                            [
                                tagId,
                                entryId
                            ]
                        )
                    }
                }                

                await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                addEntryResponseObject.responseMessage = "Add successful";
                addEntryResponseObject.responseCode = 0;
                addEntryResponseObject.addMessage = "New entry added successfully"
                addEntryResponseObject.addType = "entry"

                resolve(addEntryResponseObject)
        

            }catch(e){

                reject({e, addEntryResponseObject});

            }
        })
    }

    static deleteEntry(entryId: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>{

        return new Promise(async(resolve, reject)=>{

            const deleteEntryResponseObject: appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>={

                responseCode: 0,
                responseMessage: "Delete unsuccessful",
                deleteMessage: "",
                deleteType: "entry"
            }

            try{

                  //Get db connection
  
                  const dbResponseObject = await super.getUsersContentDBConnection();
  
                 //Begin transaction
  
                  await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
  
                  //Add new user details
  
                  const deleteEntrySqlQuery =
  
                  `DELETE FROM user_entries WHERE entry_id = ?;`
                 
                let [queryResponse] = await dbResponseObject.mysqlConnection?.query(deleteEntrySqlQuery, entryId)

                await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction

                if(queryResponse.affectedRows===0){

                    deleteEntryResponseObject.deleteMessage = "No rows affected"

                    reject(deleteEntryResponseObject);
                    return

                } else if (queryResponse.affectedRows>0){

                    deleteEntryResponseObject.responseMessage = "Delete successful";
                    deleteEntryResponseObject.responseCode = 0;
                    deleteEntryResponseObject.deleteMessage = "New entry deleted successfully"
                    deleteEntryResponseObject.deleteType = "entry"

                    resolve(deleteEntryResponseObject)
                }

            }catch(e){

                reject({e, deleteEntryResponseObject});

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
  
                 //Begin transaction
  
                  await dbResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});
  
                  //Add new user details
  
                  const deleteEntrySqlQuery =
  
                  `DELETE FROM user_tags WHERE tag_id = ?;`
                 
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

                reject({e, deleteEntryResponseObject});

            }
        })
    }
}

export default UsersContentDatabase;