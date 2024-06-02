"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_template_1 = __importDefault(require("@shared/models/models_template"));
;
const UserContentDBPool = require("./user_content_pool");
const prepared_statements_1 = __importDefault(require("../prepared_statements"));
const user_details_db_1 = __importDefault(require("../user_details/user_details_db"));
class UsersContentDatabase extends models_template_1.default {
    /* Sync Operations */
    static pushLocalContent = (userContentArray) => {
        return new Promise(async (resolve, reject) => {
            const pushLocalContentResult = {
                success: false,
                operationType: "Push local content db",
                dbError: "" //We need to indicate here what type of error occured
            };
            try {
                //Cycle through user data array and add to db sequentially
                for (let userData of userContentArray) {
                    switch (userData.dataType) {
                        case "project":
                            //Conduct project operation
                            if (userData.operationType === "create") {
                                await this.addNewProject(userData.userData);
                            }
                            else if (userData.operationType === "remove") {
                                await this.deleteProject(userData.userData);
                            }
                            //Add update project later with extension
                            break;
                        case "entry":
                            //Conduct entry operation
                            if (userData.operationType === "create") {
                                await this.addNewEntry(userData.userData);
                            }
                            else if (userData.operationType === "remove") {
                                await this.deleteEntry(userData.userData);
                            }
                            else if (userData.operationType === "update") {
                                await this.updateEntry(userData.userData);
                            }
                            break;
                        case "settings":
                            //Conduct settings change operation
                            if (userData.operationType === "update") {
                                await user_details_db_1.default.updateUserSettings(userData.userData);
                            }
                            break;
                        case "plays":
                            //Conduct plays update
                            if (userData.operationType === "update") {
                                await user_details_db_1.default.updatePlaysLeft(userData.userData);
                            }
                            break;
                        case "tags":
                            break;
                        default:
                            break;
                    }
                }
                //Assuming no errors were thrown, then we simply resolve the push local sync response
                pushLocalContentResult.success = true;
                resolve(pushLocalContentResult);
            }
            catch (e) {
                if (e.code) {
                    //Determine if it's a mysql error, as it will have a code
                    //Catch some error 
                    const DBError = e;
                    /* DETERMINE WHAT TYPE OF ERROR */
                    pushLocalContentResult.dbError = DBError.specificErrorCode;
                    reject(pushLocalContentResult);
                }
                else {
                    pushLocalContentResult.dbError = "Unknown error";
                    reject(pushLocalContentResult);
                }
            }
        });
    };
    static getAllContent = (userId) => {
        return new Promise(async (resolve, reject) => {
            const getAllContentResponse = {
                success: false,
                operationType: "Fetch All Content",
                specificErrorCode: "", //We need to indicate here what type of error occured
                resultArray: {
                    projects: [],
                    entries: [],
                    tags: []
                }
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [projects,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.projectStatements.getAllProjects, [
                        userId
                    ]);
                    const [entries,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.getAllEntries, [
                        userId
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    getAllContentResponse.resultArray.entries = entries;
                    getAllContentResponse.resultArray.projects = projects;
                    resolve(getAllContentResponse);
                }
                catch (e) {
                    console.log("SQL ERROR, fetching user content", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    getAllContentResponse.specificErrorCode = e.code;
                    reject(getAllContentResponse);
                }
                else {
                    getAllContentResponse.specificErrorCode = "Unknown error";
                    reject(getAllContentResponse);
                }
            }
        });
    };
    static addNewProject = (newProjectDetails) => {
        return new Promise(async (resolve, reject) => {
            const projectAddResponse = {
                success: false,
                specificErrorCode: "",
                operationType: "DB Project Operation"
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.projectStatements.addNewProject, [
                        newProjectDetails.userId,
                        newProjectDetails.projectName,
                        newProjectDetails.targetLanguage,
                        newProjectDetails.outputLanguage
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        projectAddResponse.specificErrorCode = "No rows affected";
                        reject(projectAddResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        projectAddResponse.success = true;
                        resolve(projectAddResponse);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, inserting project", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    projectAddResponse.specificErrorCode = e.code;
                    reject(projectAddResponse);
                }
                else {
                    projectAddResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
    static deleteProject = (deleteProjectDetails) => {
        return new Promise(async (resolve, reject) => {
            const projectDeleteResponse = {
                success: false,
                operationType: "DB Plays Operation",
                specificErrorCode: ""
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.projectStatements.deleteProject, [
                        deleteProjectDetails.userId,
                        deleteProjectDetails.projectName
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    if (queryResponse.affectedRows === 0) {
                        projectDeleteResponse.specificErrorCode = "No rows affected";
                        reject(projectDeleteResponse);
                    }
                    else if (queryResponse.affectedRows === 1) {
                        projectDeleteResponse.success = true;
                        resolve(projectDeleteResponse);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, deleting project", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    projectDeleteResponse.specificErrorCode = e.code;
                    reject(projectDeleteResponse);
                }
                else {
                    projectDeleteResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
    static addNewEntry = (newEntryObject) => {
        return new Promise(async (resolve, reject) => {
            const addEntryResponse = {
                success: false,
                operationType: "DB Entry Operation",
                specificErrorCode: ""
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    //Add new user details
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.addNewEntry, [
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
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        addEntryResponse.specificErrorCode = "No rows affected";
                        reject(addEntryResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        addEntryResponse.success = true;
                        resolve(addEntryResponse);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, inserting entry", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    addEntryResponse.specificErrorCode = e.code;
                    reject(addEntryResponse);
                }
                else {
                    projectAddResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
    static updateEntry = (updateEntryObject) => {
        return new Promise(async (resolve, reject) => {
            const updateEntryResponse = {
                success: false,
                operationType: "DB Entry Operation",
                specificErrorCode: ""
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.updateEntry, [
                        updateEntryObject.targetLanguageText,
                        updateEntryObject.targetLanguage,
                        updateEntryObject.outputLanguageText,
                        updateEntryObject.outputLanguage,
                        updateEntryObject.tags,
                        updateEntryObject.updatedAt,
                        updateEntryObject.entryId
                    ]);
                    await dbResponseObject.mysqlConnection?.commit(); // commit update entry transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        updateEntryResponse.specificErrorCode = "No rows affected";
                        reject(updateEntryResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        updateEntryResponse.success = true;
                        resolve(updateEntryResponse);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, updating entry", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    updateEntryResponse.specificErrorCode = e.code;
                    reject(updateEntryResponse);
                }
                else {
                    updateEntryResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
    static deleteEntry = (entryObject) => {
        return new Promise(async (resolve, reject) => {
            const deleteEntryResponse = {
                success: false,
                operationType: "DB Entry Operation",
                specificErrorCode: ""
            };
            try {
                //Get db connection
                const dbResponseObject = await super.getUsersContentDBConnection();
                try {
                    //Begin transaction  
                    await dbResponseObject.mysqlConnection?.beginTransaction();
                    const [queryResponse,] = await dbResponseObject.mysqlConnection?.query(prepared_statements_1.default.entryStatements.deleteEntry, entryObject.entryId);
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    //Check affected rows
                    if (queryResponse.affectedRows === 0) {
                        //No rows affected
                        deleteEntryResponse.specificErrorCode = "No rows affected";
                        reject(deleteEntryResponse);
                    }
                    else if (queryResponse.affectedRows > 0) {
                        deleteEntryResponse.success = true;
                        resolve(deleteEntryResponse);
                    }
                }
                catch (e) {
                    console.log("SQL ERROR, updating entry", e);
                    const sqlError = e;
                    throw sqlError;
                }
                finally {
                    //Release pool connection
                    UserContentDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }
            }
            catch (e) {
                if (e.code) {
                    //If an error code exists
                    deleteEntryResponse.specificErrorCode = e.code;
                    reject(deleteEntryResponse);
                }
                else {
                    deleteEntryResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        });
    };
}
exports.default = UsersContentDatabase;
//# sourceMappingURL=user_content_db.js.map