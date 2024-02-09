import * as appTypes from "@appTypes/appTypes"
const mysql = require("mysql2/promise");
const {v4: uuidv4} = require('uuid');
import vpModel from "@shared/models/models_template";
const bcrypt = require('bcrypt');


class UsersDatabase extends vpModel {

    static #checkForUsers(dbSearchObject: appTypes.DBSearchObject<appTypes.UsersLoginsDB>): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>{

        const matchResponseObject: appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig> = {
            matchMessage: "",
            responseCode: 0,
            responseMessage: "No match found"
        }

        const matchSearchArray: Array<appTypes.MatchTerms<appTypes.UsersTableColumns>> = dbSearchObject.matchTerms

        return new Promise(async(resolve, reject)=>{

            try{

                //Cycle through match search array to find a match

                for (let termObject of matchSearchArray){

                    let matchQuery = 

                    `SELECT * FROM ${dbSearchObject.table} 
                    WHERE ${termObject.column} = ?
                    `
                    
                    const [databaseResult] = await dbSearchObject.mysqlConnection.query(matchQuery, termObject.term)

                    if (databaseResult.length > 0){

                        //If the database returns a result, then the email or password exists.

                        matchResponseObject.responseMessage = "Match found";

                        reject(matchResponseObject)
                        return
                    }

                }

                //if none of the terms (email and password) match an entry in the database, then the user does not exist

                resolve(matchResponseObject)
                
            } catch (e){

                reject(e)
            }
        })
    }

    static checkAPIKey(userAPIKey: string): Promise<appTypes.DBResponseObject<appTypes.DBMatchResponseConfig>>{

        //Checks API key to esnure that connecting device has api key generated on app download.

        return new Promise(async(resolve, reject)=>{

            const matchResponseObject: appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig> = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            }

            const APIKeySarchObject: appTypes.MatchTerms<appTypes.APIKeysTableColumns> = {

                term: userAPIKey,
                column: "api_key"
            }

            try{

                const dbResponseObject = await super.getUsersDBConnection();

                if(dbResponseObject.responseMessage === "Connection unsuccessful"){
                    // If connection failed, then we reject the query, else we carry on
                    reject(dbResponseObject)
                }

                let matchQuery = 

                `SELECT * FROM api_keys 
                WHERE ${APIKeySarchObject.column} = ?; 
                `
                
                const [databaseResult] = await dbResponseObject.mysqlConnection.query(matchQuery, APIKeySarchObject.term) //Returns a result set, where the first array are the results, and the second are the headers.

                if (databaseResult.length > 0){

                    //If the database returns a result, the API key exists and the device is verified.

                    matchResponseObject.responseMessage = "Match found";

                    resolve(matchResponseObject)
                }

                reject(matchResponseObject) // API key not verified, therefore login cannot take place


            }catch(e){

                reject(matchResponseObject) // API key not verified, therefore login cannot take place

            }

        })

    }

    static loginUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>> {

        return new Promise(async(resolve, reject)=>{

            const matchResponseObject: appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig> = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            }

            try{

                const connectionResponseObject: appTypes.DBResponseObject<appTypes.DBResponseObjectConfig> = await super.getUsersDBConnection(); //Get connection to user_logins table

                if(connectionResponseObject.responseMessage === "Connection unsuccessful"){
                    //If there is a failure to connect to the database, then we reject the promise
                    reject(connectionResponseObject)
                }


                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = 

                `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `
                
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                

                if (databaseResult.length === 0){

                    //If there is a negative result, then the email or username does not exist.

                    matchResponseObject.responseMessage = "No match found";
                    matchResponseObject.matchMessage = "Username or password does not match"

                    reject(matchResponseObject)
                } else if (databaseResult.length>0) {

                    //if there is a positive match, then the user exists, we will then check the hash    
                    
                    if(await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)){
                        matchResponseObject.responseMessage = "Match found";
                        matchResponseObject.matchMessage = "User credentials verified"
                        matchResponseObject.username = databaseResult[0].username
    
                        resolve(matchResponseObject)
                    } else {
                        reject(matchResponseObject)
                    } //Compare user provided password with hash in database 
                }
                    
            }catch(e){

                reject(e)

            }
        })
    }


    //Create new user + connection and match attempt
    static createNewUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBAddUserResponseObject<appTypes.DBAddUserResponseConfig>>{

        //Attempt to get db connection

        return new Promise(async(resolve, reject)=>{


            const dbAddUserResponseObject: appTypes.DBAddUserResponseObject<appTypes.DBAddUserResponseConfig> = {
                responseCode: 0, 
                responseMessage: "New user added", 
                addMessage: ""
            }

            //Configure search array

            const usernameSearchObject: appTypes.MatchTerms<appTypes.UsersTableColumns> = {
                term: userCredentials?.userName,
                column: "username"
            } 

            const emailSearchObject: appTypes.MatchTerms<appTypes.UsersTableColumns> = {
                term: userCredentials?.email,
                column: "email"
            } 

            const matchSearchArray = [usernameSearchObject, emailSearchObject]

            try{

                const connectionResponseObject: appTypes.DBResponseObject<appTypes.DBResponseObjectConfig> = await super.getUsersDBConnection(); //Get connection to user_logins table

                if(connectionResponseObject.responseMessage === "Connection unsuccessful"){
                    //If there is a failure to connect to the database, then we reject the promise
                    dbAddUserResponseObject.responseMessage =  "New user could not be added"
                    reject(dbAddUserResponseObject)
                    return
                }

                const checkResponse = await this.#checkForUsers({mysqlConnection:connectionResponseObject.mysqlConnection, table:"users", matchTerms: matchSearchArray});

                //check if passow

                if(checkResponse.responseMessage === "No match found"){
                    //IF no match found in checking for users

                    //New user id

                    const newUserId = super.generateUUID();

                    //Password hash

                    const addUserSqlQuery =  `INSERT INTO users VALUES (?, ?, ?, ?, DEFAULT, DEFAULT);` //id, username, email, password_hash

                    const addResult = await connectionResponseObject.mysqlConnection.query(
                        addUserSqlQuery,
                        [
                            newUserId,
                            userCredentials.userName,
                            userCredentials.email,
                            userCredentials.password
                        ])
            

                    dbAddUserResponseObject.responseMessage = "New user added";
                    dbAddUserResponseObject.responseCode = 0;
                    dbAddUserResponseObject.addMessage = newUserId; //Send the user id back to add new details

                    resolve(dbAddUserResponseObject)
                    return
                }

            }catch(e){

                console.log(e);

                //If there is some error...
                dbAddUserResponseObject.responseMessage = "New user could not be added";
                dbAddUserResponseObject.addMessage = e
                reject(dbAddUserResponseObject);
                return
            }
        })

    }

    //Delete user
    static deleteUser(userCredentials: appTypes.UserCredentials){

        return new Promise(async(resolve, reject)=>{

            const dbDeleteUserResponseObject: appTypes.DBDeleteUserResponseObject<appTypes.DBDeleteUserResponseConfig> = {
                responseCode: 0, 
                responseMessage: "User could not be deleted", 
                deleteMessage: ""
            };

            try{

                const connectionResponseObject: appTypes.DBResponseObject<appTypes.DBResponseObjectConfig> = await super.getUsersDBConnection(); //Get connection to user_logins table

                if(connectionResponseObject.responseMessage === "Connection unsuccessful"){
                    //If there is a failure to connect to the database, then we reject the promise
                    dbDeleteUserResponseObject.responseMessage =  "User could not be deleted"
                    reject(dbDeleteUserResponseObject)
                    return
                }

                connectionResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = 

                `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `
                
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                

                if (databaseResult.length === 0){

                    //If there is a negative result, then the email or username does not exist.

                    dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                    dbDeleteUserResponseObject.deleteMessage = "Username or password does not match"

                    reject(dbDeleteUserResponseObject)
                } else if (databaseResult.length>0) {

                    //if there is a positive match, then the user exists, we will then check the hash    
                    
                    if(await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                        dbDeleteUserResponseObject.deleteMessage = "Username or password does not match"
                        reject(dbDeleteUserResponseObject)
                        return
                    } 
                }

                //IF match found in checking for users, then account can be deleted.

                const deleteUserSqlQuery =  
                `DELETE FROM users 
                WHERE username = ?
                ;` 
                
                await connectionResponseObject.mysqlConnection?.query(
                    deleteUserSqlQuery, userCredentials.userName, err=>{
                        throw err
                        return
                });

                connectionResponseObject.mysqlConnection?.commit()
        

                dbDeleteUserResponseObject.responseMessage = "User successfully deleted";
                dbDeleteUserResponseObject.responseCode = 0;

                resolve(dbDeleteUserResponseObject)                

            }catch(e){

                console.log(e);

                //If there is some error...
                dbDeleteUserResponseObject.responseMessage = "User could not be deleted";
                dbDeleteUserResponseObject.deleteMessage = e
                resolve(dbDeleteUserResponseObject);
                return
            }
        })
    };

    //Update password

    static updatePassword(userCredentials: appTypes.UserCredentials, newPassword: string): Promise<appTypes.DBUpdatePasswordResponseObject<appTypes.DBUpdatePasswordResponseConfig>>{
        return new Promise(async(resolve, reject)=>{

            const dbUpdatePasswordResponseObject: appTypes.DBUpdatePasswordResponseObject<appTypes.DBUpdatePasswordResponseConfig> = {
                responseCode: 0, 
                responseMessage: "Password could not be updated", 
                updateMessage: ""
            };

            try{

                const connectionResponseObject: appTypes.DBResponseObject<appTypes.DBResponseObjectConfig> = await super.getUsersDBConnection(); //Get connection to user_logins table

                if(connectionResponseObject.responseMessage === "Connection unsuccessful"){
                    //If there is a failure to connect to the database, then we reject the promise
                
                    resolve(dbUpdatePasswordResponseObject)
                    return
                }

                //Get user details ( Note that usernames are uqniue in the database )
                let userMatchQuery = 

                `SELECT * FROM users 
                WHERE ${userCredentials.identifierType} = ?
                `
                
                const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.userName);
                

                if (databaseResult.length === 0){

                    //If there is a negative result, then the email or username does not exist.

                    dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated"
                    dbUpdatePasswordResponseObject.updateMessage = "Username or password does not match"

                    reject(dbUpdatePasswordResponseObject)
                } else if (databaseResult.length>0) {

                    //if there is a positive match, then the user exists, we will then check the hash    
                    
                    if(await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated"
                        dbUpdatePasswordResponseObject.deleteMessage = "Username or password does not match"
                        reject(dbUpdatePasswordResponseObject)
                    } 
                }
                

                //IF match found in checking for users, then account can be updated.

                const updatePasswordSqlQuery =  
                `UPDATE users 
                SET password_hash = ?
                WHERE username = ?
                ;` 
                
                //new password_hash, username

                const updatePasswordResult = await connectionResponseObject.mysqlConnection.query(
                    updatePasswordSqlQuery, [newPassword, userCredentials.userName])
        

                dbUpdatePasswordResponseObject.responseMessage = "Password updated successfully";
                

                resolve(dbUpdatePasswordResponseObject)
                

            }catch(e){

                console.log(e);

                //If there is some error...
                dbUpdatePasswordResponseObject.updateMessage = "User password could not be deleted"
                dbUpdatePasswordResponseObject.responseMessage = "Password could not be updated"
                resolve(dbUpdatePasswordResponseObject)
                
            }
        })
    }

}

export default UsersDatabase