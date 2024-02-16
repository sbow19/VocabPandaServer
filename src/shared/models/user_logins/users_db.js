"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require('uuid');
const models_template_1 = __importDefault(require("@shared/models/models_template"));
const bcrypt = require('bcrypt');
class UsersDatabase extends models_template_1.default {
    static #checkForUsers(dbSearchObject) {
        const matchResponseObject = {
            matchMessage: "",
            responseCode: 0,
            responseMessage: "No match found"
        };
        const matchSearchArray = dbSearchObject.matchTerms;
        return new Promise(async (resolve, reject) => {
            try {
                //Cycle through match search array to find a match
                for (let termObject of matchSearchArray) {
                    let matchQuery = `SELECT * FROM ${dbSearchObject.table} 
                    WHERE ${termObject.column} = ?
                    `;
                    const [databaseResult] = await dbSearchObject.mysqlConnection.query(matchQuery, termObject.term);
                    if (databaseResult.length > 0) {
                        //If the database returns a result, then the email or password exists.
                        matchResponseObject.responseMessage = "Match found";
                        reject(matchResponseObject);
                        return;
                    }
                }
                //if none of the terms (email and password) match an entry in the database, then the user does not exist
                resolve(matchResponseObject);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static checkCredentials(userCredentials) {
        //Checks API key to esnure that connecting device has api key generated on app download.
        return new Promise(async (resolve, reject) => {
            const matchResponseObject = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            };
            try {
                const dbResponseObject = await super.getUsersDBConnection();
                if (dbResponseObject.responseMessage === "Connection unsuccessful") {
                    // If connection failed, then we reject the query, else we carry on
                    throw dbResponseObject;
                }
                let matchQuery = `SELECT * FROM api_keys 
                WHERE api_key = ?
                AND device_id = ?
                ; 
                `;
                const [databaseResult] = await dbResponseObject.mysqlConnection.query(matchQuery, [
                    userCredentials.pass,
                    userCredentials.name
                ]); //Returns a result set, where the first array are the results, and the second are the headers.
                if (databaseResult.length > 0) {
                    //If the database returns a result, the API key exists and the device is verified.
                    matchResponseObject.responseMessage = "Match found";
                    matchResponseObject.matchMessage = "Device verified";
                    resolve(matchResponseObject);
                    return;
                }
                else if (databaseResult.length === 0) {
                    matchResponseObject.matchMessage = "Device could not be verified";
                    throw matchResponseObject; // API key not verified, therefore login cannot take place
                }
            }
            catch (e) {
                reject(e); // API key not verified, therefore login cannot take place
            }
        });
    }
    //#TODO, logic to provide app with details on premium status, verified, updates, refresh changes etc.
    static loginUser(userCredentials) {
        return new Promise(async (resolve, reject) => {
            const matchResponseObject = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    reject(connectionResponseObject);
                }
                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `;
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                if (databaseResult.length === 0) {
                    //If there is a negative result, then the email or username does not exist.
                    matchResponseObject.responseMessage = "No match found";
                    matchResponseObject.matchMessage = "Username or password does not match";
                    reject(matchResponseObject);
                }
                else if (databaseResult.length > 0) {
                    //if there is a positive match, then the user exists, we will then check the hash    
                    if (await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)) {
                        matchResponseObject.responseMessage = "Match found";
                        matchResponseObject.matchMessage = "User credentials verified";
                        matchResponseObject.username = databaseResult[0].username;
                        resolve(matchResponseObject);
                    }
                    else {
                        reject(matchResponseObject);
                    } //Compare user provided password with hash in database 
                }
            }
            catch (e) {
                reject(e);
            }
        });
    }
    //Create new user + connection and match attempt
    static createNewUser(userCredentials) {
        //Attempt to get db connection
        return new Promise(async (resolve, reject) => {
            const dbAddUserResponseObject = {
                responseCode: 0,
                responseMessage: "New user added",
                addMessage: ""
            };
            //Configure search array
            const usernameSearchObject = {
                term: userCredentials?.userName,
                column: "username"
            };
            const emailSearchObject = {
                term: userCredentials?.email,
                column: "email"
            };
            const matchSearchArray = [usernameSearchObject, emailSearchObject];
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    dbAddUserResponseObject.responseMessage = "New user could not be added";
                    reject(dbAddUserResponseObject);
                    return;
                }
                const checkResponse = await this.#checkForUsers({ mysqlConnection: connectionResponseObject.mysqlConnection, table: "users", matchTerms: matchSearchArray });
                //check if passow
                if (checkResponse.responseMessage === "No match found") {
                    //IF no match found in checking for users
                    //New user id
                    const newUserId = super.generateUUID();
                    connectionResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                    //Password hash
                    const addUserSqlQuery = `INSERT INTO users VALUES (?, ?, ?, ?, DEFAULT, DEFAULT, 0);`; //id, username, email, password_hash, verified
                    const addResult = await connectionResponseObject.mysqlConnection?.query(addUserSqlQuery, [
                        newUserId,
                        userCredentials.userName,
                        userCredentials.email,
                        userCredentials.password
                    ]);
                    //Connect new user id to device id
                    const addUserDevice = `UPDATE api_keys 
                    SET user_id = ? 
                    WHERE
                        api_key = ?
                    AND
                        device_id = ? 
                    `;
                    await connectionResponseObject.mysqlConnection?.query(addUserDevice, [
                        newUserId,
                        userCredentials.apiKey,
                        userCredentials.deviceId
                    ]);
                    connectionResponseObject.mysqlConnection?.commit();
                    dbAddUserResponseObject.responseMessage = "New user added";
                    dbAddUserResponseObject.responseCode = 0;
                    dbAddUserResponseObject.addMessage = newUserId; //Send the user id back to add new details
                    resolve(dbAddUserResponseObject);
                    return;
                }
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbAddUserResponseObject.responseMessage = "New user could not be added";
                dbAddUserResponseObject.addMessage = e;
                reject(dbAddUserResponseObject);
                return;
            }
        });
    }
    //Delete user
    static deleteUser(userCredentials) {
        return new Promise(async (resolve, reject) => {
            const dbDeleteUserResponseObject = {
                responseCode: 0,
                responseMessage: "User could not be deleted",
                deleteMessage: ""
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                    reject(dbDeleteUserResponseObject);
                    return;
                }
                connectionResponseObject.mysqlConnection?.beginTransaction(err => { throw err; });
                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `;
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                if (databaseResult.length === 0) {
                    //If there is a negative result, then the email or username does not exist.
                    dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                    dbDeleteUserResponseObject.deleteMessage = "Username or password does not match";
                    reject(dbDeleteUserResponseObject);
                }
                else if (databaseResult.length > 0) {
                    //if there is a positive match, then the user exists, we will then check the hash    
                    if (await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)) {
                        //match successful Leave empty, continue
                    }
                    else {
                        dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                        dbDeleteUserResponseObject.deleteMessage = "Username or password does not match";
                        reject(dbDeleteUserResponseObject);
                        return;
                    }
                }
                //IF match found in checking for users, then account can be deleted.
                const deleteUserSqlQuery = `DELETE FROM users 
                WHERE username = ?
                ;`;
                await connectionResponseObject.mysqlConnection?.query(deleteUserSqlQuery, userCredentials.userName, err => {
                    throw err;
                    return;
                });
                connectionResponseObject.mysqlConnection?.commit();
                dbDeleteUserResponseObject.responseMessage = "User successfully deleted";
                dbDeleteUserResponseObject.responseCode = 0;
                resolve(dbDeleteUserResponseObject);
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                dbDeleteUserResponseObject.deleteMessage = e;
                resolve(dbDeleteUserResponseObject);
                return;
            }
        });
    }
    ;
    //Update password
    static updatePassword(userCredentials, newPassword) {
        return new Promise(async (resolve, reject) => {
            const dbUpdatePasswordResponseObject = {
                responseCode: 0,
                responseMessage: "Password could not be updated",
                updateMessage: ""
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    resolve(dbUpdatePasswordResponseObject);
                    return;
                }
                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `;
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                if (databaseResult.length === 0) {
                    //If there is a negative result, then the email or username does not exist.
                    dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated";
                    dbUpdatePasswordResponseObject.updateMessage = "Username or password does not match";
                    reject(dbUpdatePasswordResponseObject);
                }
                else if (databaseResult.length > 0) {
                    //if there is a positive match, then the user exists, we will then check the hash    
                    if (await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)) {
                        //match successful Leave empty, continue
                    }
                    else {
                        dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated";
                        dbUpdatePasswordResponseObject.deleteMessage = "Username or password does not match";
                        reject(dbUpdatePasswordResponseObject);
                    }
                }
                //IF match found in checking for users, then account can be updated.
                const updatePasswordSqlQuery = `UPDATE users 
                SET password_hash = ?
                WHERE username = ?
                ;`;
                //new password_hash, username
                const updatePasswordResult = await connectionResponseObject.mysqlConnection.query(updatePasswordSqlQuery, [newPassword, userCredentials.userName]);
                dbUpdatePasswordResponseObject.responseMessage = "Password updated successfully";
                resolve(dbUpdatePasswordResponseObject);
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbUpdatePasswordResponseObject.updateMessage = "User password could not be deleted";
                dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated";
                resolve(dbUpdatePasswordResponseObject);
            }
        });
    }
    //Save email verification token
    static saveEmailVerification(token, email) {
        return new Promise(async (resolve, reject) => {
            const dbAddResponseObject = {
                responseCode: 0,
                responseMessage: "Add unsuccessful",
                addMessage: "",
                addType: "entry"
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    resolve(dbAddResponseObject);
                    return;
                }
                ;
                //Get token expiry (1 hour);
                const tokenExpiry = super.getTokenExpiry();
                //Save token, email, and token expiry
                const saveVerificationQuery = `INSERT INTO verification VALUES (?, ?, ?);`; //email, token, token_expiry
                await connectionResponseObject.mysqlConnection?.query(saveVerificationQuery, [
                    email,
                    token,
                    tokenExpiry
                ]);
                dbAddResponseObject.addMessage = "Token saved successfully";
                dbAddResponseObject.responseMessage = "Add successful";
                resolve(dbAddResponseObject);
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbAddResponseObject.addMessage = "Token could not be saved";
                dbAddResponseObject.responseMessage = "Add unsuccessful";
                reject(dbAddResponseObject);
            }
        });
    }
    //Check email verification time
    static checkEmailVerification(token) {
        return new Promise(async (resolve, reject) => {
            const dbMatchResponseObject = {
                responseCode: 0,
                responseMessage: "No match found",
                matchMessage: ""
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    reject(dbMatchResponseObject);
                    return;
                }
                ;
                //Get current time
                const currentTime = super.getCurrentTime();
                //Check if token exists and has not expired
                const checkVerificationQuery = `
                SELECT * FROM verification 
                WHERE token = ?
                AND token_expiry > ?
                ;`; //token, currentTime
                const [queryResult] = await connectionResponseObject.mysqlConnection?.query(checkVerificationQuery, [
                    token,
                    currentTime
                ]);
                if (queryResult.length === 1) {
                    dbMatchResponseObject.matchMessage = "Token saved successfully";
                    dbMatchResponseObject.responseMessage = "Match found";
                    resolve({ dbMatchResponseObject, queryResult });
                }
                else if (queryResult.length === 0) {
                    throw "error";
                }
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbMatchResponseObject.matchMessage = "Token either expired or does not exist";
                dbMatchResponseObject.responseMessage = "No match found";
                reject(dbMatchResponseObject);
            }
        });
    }
    //Delete  email verification  token
    static deleteEmailVerification(token) {
        return new Promise(async (resolve, reject) => {
            const dbDeleteResponseObject = {
                responseCode: 0,
                responseMessage: "Delete unsuccessful",
                deleteMessage: ""
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    reject(dbDeleteResponseObject);
                    return;
                }
                ;
                //Save token, email, and token expiry
                const saveVerificationQuery = `DELETE FROM verification WHERE token =?;`; //email
                await connectionResponseObject.mysqlConnection?.query(saveVerificationQuery, [
                    token
                ]);
                dbDeleteResponseObject.deleteMessage = "Token deleted successfully";
                dbDeleteResponseObject.responseMessage = "Delete successful";
                resolve(dbDeleteResponseObject);
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbDeleteResponseObject.deleteMessage = "Token could not be deleted";
                dbDeleteResponseObject.responseMessage = "Delete unsuccessful";
                reject(dbDeleteResponseObject);
            }
        });
    }
    //Update verification status
    //Check email verification time
    static updateVerification(email) {
        return new Promise(async (resolve, reject) => {
            const dbUpdateResponseObject = {
                responseCode: 0,
                responseMessage: "Update unsuccessful",
                updateMessage: ""
            };
            try {
                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table
                if (connectionResponseObject.responseMessage === "Connection unsuccessful") {
                    //If there is a failure to connect to the database, then we reject the promise
                    reject(dbUpdateResponseObject);
                    return;
                }
                ;
                //Update user verification status here
                const updateVerificationQuery = `
                UPDATE users 
                SET verified = 1
                WHERE email = ?
                
                ;`; //email
                await connectionResponseObject.mysqlConnection?.query(updateVerificationQuery, [
                    email
                ]);
                resolve(dbUpdateResponseObject);
            }
            catch (e) {
                console.log(e);
                //If there is some error...
                dbUpdateResponseObject.updateMessage = "User verification status updated";
                dbUpdateResponseObject.responseMessage = "Update successful";
                reject(dbUpdateResponseObject);
            }
        });
    }
}
exports.default = UsersDatabase;
//# sourceMappingURL=users_db.js.map