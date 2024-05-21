"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const { v4: uuidv4 } = require('uuid');
const strftime = require('strftime');
const UserContentDBPool = require("./user_content_pool");
const prepared_statements_1 = __importDefault(require("../prepared_statements"));
class UsersContentDatabase extends models_template_1.default {
    static addNewProject = (newProjectDetails) => {
        return new Promise(async (resolve, reject) => {
            const projectAddResponseObject = {
                message: "operation unsuccessful",
                operationType: "create",
                contentType: "project",
                success: false
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.projectStatements.addNewProject, [
                        newProjectDetails.userId,
                        newProjectDetails.projectName,
                        newProjectDetails.targetLanguage,
                        newProjectDetails.outputLanguage
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    projectAddResponseObject.message = "operation successful";
                    projectAddResponseObject.success = true;
                    resolve(projectAddResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e);
                projectAddResponseObject.error = e;
                reject(projectAddResponseObject);
            }
        });
    };
    static deleteProject = (deleteProjectDetails) => {
        return new Promise(async (resolve, reject) => {
            const projectDeleteResponse = {
                success: false,
                message: "operation unsuccessful",
                operationType: "remove",
                contentType: "project"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.projectStatements.deleteProject, [
                        deleteProjectDetails.userId,
                        deleteProjectDetails.projectName
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    if (queryResponse.affectedRows === 0) {
                        projectDeleteResponse.message = "operation unsuccessful";
                        reject(projectDeleteResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        projectDeleteResponse.message = "operation successful";
                        projectDeleteResponse.success = true;
                        resolve(projectDeleteResponse);
                    }
                }
                catch (e) {
                    throw e;
                }
                finally {
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e, "delete project error");
                projectDeleteResponse.message = "operation unsuccessful";
                reject(projectDeleteResponse);
            }
        });
    };
    static addNewEntry = (newEntryObject) => {
        return new Promise(async (resolve, reject) => {
            const addEntryResponseObject = {
                message: "operation unsuccessful",
                success: false,
                operationType: "create",
                contentType: "entry"
            };
            try {
                //Generate entry id
                const entryId = uuidv4();
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Add new user details
                    await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.addNewEntry, [
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
                    ]);
                    //add tags query
                    if (newEntryObject.tags === 1) {
                        for (let tagId of newEntryObject.tagsArray) {
                            await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.addEntryTags, [
                                tagId,
                                entryId
                            ]);
                        }
                    }
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    addEntryResponseObject.message = "operation successful";
                    addEntryResponseObject.success = true;
                    resolve(addEntryResponseObject);
                }
                catch (e) {
                    console.log(e);
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                addEntryResponseObject.error = e;
                reject(addEntryResponseObject);
            }
        });
    };
    static updateEntry = (updateEntryObject) => {
        return new Promise(async (resolve, reject) => {
            const updateEntryResponseObject = {
                message: "operation unsuccessful",
                success: false,
                operationType: "update",
                contentType: "entry"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.updateEntry, [
                        updateEntryObject.targetLanguageText,
                        updateEntryObject.targetLanguage,
                        updateEntryObject.outputLanguageText,
                        updateEntryObject.outputLanguage,
                        updateEntryObject.tags,
                        updateEntryObject.updatedAt,
                        updateEntryObject.entryId
                    ]);
                    //update tags query
                    if (updateEntryObject.tags === 1) {
                        // Remove all tags associated with entry_id, and then  re add them.
                        await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.removeEntryTags, [updateEntryObject.entryId]);
                        for (let tagId of updateEntryObject.tagsArray) {
                            await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.addEntryTags, [
                                tagId,
                                updateEntryObject.entryId
                            ]);
                        }
                    }
                    ;
                    await dbResponseObject.mysqlConnection?.commit(); // commit update entry transaction
                    updateEntryResponseObject.message = "operation successful";
                    updateEntryResponseObject.success = true;
                    resolve(updateEntryResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                updateEntryResponseObject.error = e;
                reject(updateEntryResponseObject);
            }
        });
    };
    static deleteEntry = (entryId) => {
        return new Promise(async (resolve, reject) => {
            const deleteEntryResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "remove",
                contentType: "entry"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction  
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    const [queryResponse] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.deleteEntry, entryId);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    if (queryResponse.affectedRows === 0) {
                        deleteEntryResponse.message = "operation unsuccessful";
                        reject(deleteEntryResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        deleteEntryResponse.message = "operation successful";
                        deleteEntryResponse.success = true;
                        resolve(deleteEntryResponse);
                    }
                    resolve(deleteEntryResponse);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                console.log(e, "delete entry error");
                deleteEntryResponse.error = e;
                reject(deleteEntryResponse);
            }
        });
    };
    static addTag = (tagName, username) => {
        return new Promise(async (resolve, reject) => {
            const addTagResponseObject = {
                responseCode: 0,
                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "tag"
            };
            try {
                //get user id 
                const { matchMessage } = await super.getUserId(username);
                const userId = matchMessage;
                //Generate tag id
                const tagId = uuidv4();
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Add new tag details
                    const addNewEntrySqlQuery = `INSERT INTO user_tags VALUES (?, ?, ?);`;
                    /*
                        user_id
                        tag_name
                        tag_id
                    */
                    await dbResponseObject.mysqlConnection?.query(addNewEntrySqlQuery, [
                        userId,
                        tagName,
                        tagId
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    addTagResponseObject.responseMessage = "Add successful";
                    addTagResponseObject.responseCode = 0;
                    addTagResponseObject.addMessage = "New tag added successfully";
                    addTagResponseObject.addType = "tag";
                    resolve(addTagResponseObject);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                reject({ e, addTagResponseObject });
            }
        });
    };
    static deleteTag = (tagId) => {
        return new Promise(async (resolve, reject) => {
            const deleteTagResponseObject = {
                responseCode: 0,
                responseMessage: "Delete unsuccessful",
                deleteMessage: "",
                deleteType: "tag"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Add new user details
                    const deleteEntrySqlQuery = `DELETE FROM user_tags WHERE tag_id = ?;`;
                    let [queryResponse] = await dbResponseObject.mysqlConnection?.query(deleteEntrySqlQuery, tagId);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    if (queryResponse.affectedRows === 0) {
                        deleteTagResponseObject.deleteMessage = "No rows affected";
                        reject(deleteTagResponseObject);
                        return;
                    }
                    else if (queryResponse.affectedRows > 0) {
                        deleteTagResponseObject.responseMessage = "Delete successful";
                        deleteTagResponseObject.responseCode = 0;
                        deleteTagResponseObject.deleteMessage = "Tag deleted successfully";
                        deleteTagResponseObject.deleteType = "tag";
                        resolve(deleteTagResponseObject);
                    }
                }
                catch (e) {
                    throw e;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                reject({ e, deleteEntryResponseObject });
            }
        });
    };
}
exports.default = UsersContentDatabase;
//# sourceMappingURL=user_content_db.js.map