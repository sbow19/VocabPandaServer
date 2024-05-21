import * as appTypes from "@appTypes/appTypes"
import vpModel from "@shared/models/models_template";
import preparedSQLStatements from "../prepared_statements";
import { PoolConnection } from "mysql2/typings/mysql/lib/PoolConnection";
const bcrypt = require('bcrypt');
const basicAuth = require("basic-auth");
const UserDBPool = require("./users_db_pool");


class UsersDatabase extends vpModel {


    static checkCredentials(userCredentials: {name: string, pass: string}): Promise<appTypes.DBResponseObject<appTypes.DBMatchResponseConfig>>{

        //Checks API key to esnure that connecting device has api key generated on app download.

        return new Promise(async(resolve, reject)=>{

            const matchResponseObject: appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig> = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            }


            try{

                const dbResponseObject = await super.getUsersDBConnection(); //Get user logins pool connection

                if(dbResponseObject.responseMessage === "Connection unsuccessful"){
                    // If connection failed, then we reject the query, else we carry on
                    throw dbResponseObject;
                }

                let matchQuery = 

                `SELECT * FROM api_keys 
                WHERE api_key = ?
                AND device_id = ?
                ; 
                `
                try{

                    const [databaseResult] = await dbResponseObject.mysqlConnection.query(matchQuery, [
                        userCredentials.pass,
                        userCredentials.name
                    ]) //Returns a result set, where the first array are the results, and the second are the headers.
    
                    if (databaseResult.length > 0){
    
                        //If the database returns a result, the API key exists and the device is verified.
    
                        matchResponseObject.responseMessage = "Match found";
                        matchResponseObject.matchMessage = "Device verified";
    
                        resolve(matchResponseObject)
                        return
                    } else if (databaseResult.length === 0){
    
                        matchResponseObject.matchMessage = "Device could not be verified"
    
                        throw matchResponseObject // API key not verified, therefore login cannot take place
                    }

                }catch(e){

                    console.log(console.trace())
                    throw e

                }finally{

                    UserDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){

                reject(e) // API key not verified, therefore login cannot take place
                
            }

        })

    }


    //#TODO, logic to provide app with details on premium status, verified, updates, refresh changes etc.
    static loginUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>> {

        return new Promise(async(resolve, reject)=>{

            const matchResponseObject: appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig> = {
                matchMessage: "",
                responseCode: 0,
                responseMessage: "No match found"
            }

            try{

                const connectionResponseObject: appTypes.DBResponseObject<appTypes.DBResponseObjectConfig> = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    connectionResponseObject.mysqlConnection?.beginTransaction(err=>{throw e})

                    if(connectionResponseObject.responseMessage === "Connection unsuccessful"){
                        //If there is a failure to connect to the database, then we reject the promise
                        reject(connectionResponseObject)
                    }
    
    
                    //Get user details ( Note that usernames are uqniue in the database )
                    const userMatchQuery = 
    
                    `SELECT * FROM users 
                    WHERE username = ?
                    ;
                    `
    
                    const emailMatchQuery = 
    
                    `
                    SELECT * FROM users
                    WHERE email = ?
                    ;
                    `
                    
                    const [userDatabaseResult] = await connectionResponseObject.mysqlConnection?.query(userMatchQuery, userCredentials.username);
                    const [emailDatabaseResult] = await connectionResponseObject.mysqlConnection?.query(emailMatchQuery, userCredentials.username);
    
                    if (userDatabaseResult.length === 0 && emailDatabaseResult.length === 0){
    
                        //If there is a negative result, then the email or username does not exist.
    
                        matchResponseObject.responseMessage = "No match found";
                        matchResponseObject.matchMessage = "Username or password does not match"
    
                        resolve(matchResponseObject)
                    } 
                    
                    else if (userDatabaseResult.length > 0) {
    
                        //if there is a positive match, then the user exists, we will then check the hash    
                        
                        if(await bcrypt.compare(userCredentials.password, userDatabaseResult[0].password_hash)){
                            matchResponseObject.responseMessage = "Match found";
                            matchResponseObject.matchMessage = "User credentials verified"
                            matchResponseObject.username = userDatabaseResult[0].username
        
                            resolve(matchResponseObject)
                        } else {
                            resolve(matchResponseObject)
                        } //Compare user provided password with hash in database 
                    } 
                    
                    else if (emailDatabaseResult.length > 0) {
    
                        //if there is a positive match, then the user exists, we will then check the hash    
                        
                        if(await bcrypt.compare(userCredentials.password, emailDatabaseResult[0].password_hash)){
                            matchResponseObject.responseMessage = "Match found";
                            matchResponseObject.matchMessage = "User credentials verified"
                            matchResponseObject.username = emailDatabaseResult[0].username
        
                            resolve(matchResponseObject)
                        } else {
                            resolve(matchResponseObject)
                        } //Compare user provided password with hash in database 
                    }

                }catch(e){

                    throw e

                }finally{

                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);

                }

                    
            }catch(e){

                reject(e)

            }
        })
    }

    //Check for existsing users
    static #checkForUsers(dbConnection: PoolConnection, userCredentials: appTypes.UserCredentials): Promise<appTypes.dbMatchResponse> {

        return new Promise(async(resolve, reject)=>{

            const matchResponse: appTypes.dbMatchResponse = {
                match: false
            }

            try{

                    
                    const [userDatabaseResult] = await dbConnection.query(
                        preparedSQLStatements.generalStatements.usersUsernameMatch, 
                        userCredentials.username
                    );

                    const [emailDatabaseResult] = await dbConnection.query(
                        preparedSQLStatements.generalStatements.usersEmailMatch, 
                        userCredentials.email
                    );
    
                    if (userDatabaseResult.length === 0 && emailDatabaseResult.length === 0){
    
                        //If there is a negative result, then the email or username does not exist.
    
                        matchResponse.match = false;
                        resolve(matchResponse);
                    } 
                    
                    else if (userDatabaseResult.length > 0) {
    
                        //if there is a positive match, then the user exists, so we resolve the match object
                        matchResponse.match = true;
                        matchResponse.matchTerm = userDatabaseResult;
                        resolve(matchResponse);
                        
                    } 
                    
                    else if (emailDatabaseResult.length > 0) {

                        //if there is a positive match, then the user exists, so we resolve the match object
                        matchResponse.match = true;
                        matchResponse.matchTerm = emailDatabaseResult;
                        resolve(matchResponse);
    
                        
                    }

                }catch(e){

                    matchResponse.error = e;
                    reject(e);

                }

                
        })
    }

    //Create new user + connection and match attempt
    static createNewUser(userCredentials: appTypes.APICreateAccount, deviceCredentials): Promise<appTypes.APIAccountOperationResponse>{

        //Attempt to get db connection

        return new Promise(async(resolve, reject)=>{


            const createUserResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "create",
                contentType: "account",
                accountOperation: "create account"
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{
                    
                    //Check for user details, if no match then
                    const matchMessage = await this.#checkForUsers(connectionResponseObject.mysqlConnection, userCredentials);

                    //If match then we reject the promise
                    if(matchMessage.match){
                        throw matchMessage
                    }

                    //New user id

                    const newUserId = super.generateUUID();

                    connectionResponseObject.mysqlConnection?.beginTransaction(err=>{throw err});

                    //Password hash

                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.addAccount,
                        [
                            newUserId,
                            userCredentials.username,
                            userCredentials.email,
                            userCredentials.password
                        ]
                    )
                    
                    //Connect new user id to device id 

                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.connectUserDeviceToAccount,[
                        newUserId,
                        deviceCredentials.pass,
                        deviceCredentials.name
                    ])

                    connectionResponseObject.mysqlConnection?.commit();
                

                    createUserResponse.success = true;
                    createUserResponse.message = "operation successful";
                    createUserResponse.userId = newUserId; //Send the user id back to add new details

                    resolve(createUserResponse)
                        


                }catch(e){
                    throw e
                }finally{

                    //Release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }

                

            }catch(e){

                console.log(e);

                if(e.match === "match"){

                    createUserResponse.customResponse = "user exists"
                    reject(createUserResponse)
                } else {

                    //If there is some error...
                    createUserResponse.error = e;
                    reject(createUserResponse);

                }
                
            }
        })

    }

    //Delete user
    static deleteUser(userCredentials: appTypes.APIDeleteAccount): Promise<appTypes.APIAccountOperationResponse>{

        return new Promise(async(resolve, reject)=>{

            const deleteUserResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "remove",
                contentType: "account",
                accountOperation: "delete account"
            };

            try{

                const dbConnection = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    dbConnection.mysqlConnection?.beginTransaction(err=>{throw err})
                    
    
                    const [databaseResult] = await dbConnection.mysqlConnection?.query(
                        preparedSQLStatements.generalStatements.userIdMatch
                        , 
                    [userCredentials.userId,
                         userCredentials.userId]);
                    

   
                    if(await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        throw deleteUserResponse;
                    } 
                    

                    //IF match found in checking for users, then account can be deleted. 
                
                    await dbConnection.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.deleteAccount, 
                        [
                            userCredentials.userId,
                            userCredentials.userId

                        ])

                    dbConnection.mysqlConnection?.commit();

            

                    deleteUserResponse.message = "operation successful";
                    deleteUserResponse.success = true;

                    resolve(deleteUserResponse)  

                }catch(e){
                    throw e
                }finally{

                    //Release 
                    UserDBPool.releaseConnection(dbConnection.mysqlConnection);

                }              

            }catch(e){
                console.log(e);

                //If there is some error...
                deleteUserResponse.error = e
                reject(deleteUserResponse);
                
            }
        })
    };

    //Update password

    static updatePassword(accountObject: appTypes.APIUpdatePassword): Promise<appTypes.APIAccountOperationResponse>{
        return new Promise(async(resolve, reject)=>{



            const updatePasswordResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "update",
                contentType: "account",
                accountOperation: "change password"
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{
                             
                    connectionResponseObject.mysqlConnection?.beginTransaction(err=>{throw err})
                    
    
                    const [databaseResult] = await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.generalStatements.userIdMatch
                        , 
                    accountObject.userId);
                    

                    //if there is a positive match, then the user exists, we will then check the hash    
                    
                    if(await bcrypt.compare(accountObject.oldPassword, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        reject(updatePasswordResponse)
                        return
                    } 

                    //Generate new hashed password

                    const salt = await bcrypt.genSalt();
                    const hashedPassword = await bcrypt.hash(accountObject.newPassword, salt);
                    
                    //new password_hash, username

                    await connectionResponseObject.mysqlConnection.query(
                        preparedSQLStatements.accountStatements.updatePassword,
                        [hashedPassword, accountObject.userId]
                    );
                    
                    updatePasswordResponse.message = "operation successful";
                    updatePasswordResponse.success = true;

                    resolve(updatePasswordResponse);

                }catch(e){
                    throw e

                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                } 

            }catch(e){

                console.log(e);

                //If there is some error...
                updatePasswordResponse.error = e;
                reject(updatePasswordResponse);
                
            }
        })
    }

    //Save email verification token
    static saveEmailVerification(token: string, email: string): Promise<appTypes.APIAccountOperationResponse>{
        return new Promise(async(resolve, reject)=>{

            const addEmailTokenResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "create",
                contentType: "account",
                accountOperation: "create account"
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    //Get token expiry (1 hour);

                    const tokenExpiry = super.getTokenExpiry(); 

                    //Save token, email, and token expiry
                    
                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.addEmailVerificationToken, 
                        [
                            email,
                            token,
                            tokenExpiry
                        ]
                    );

                    addEmailTokenResponse.success = true;
                    addEmailTokenResponse.message = "operation successful";
                    
                    resolve(addEmailTokenResponse);

                }catch(e){
                    throw e 
                }finally{

                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
            
            }catch(e){
                console.log(e);
                console.log(console.trace());
                //If there is some error...
                addEmailTokenResponse.error = e;
                reject(addEmailTokenResponse);
            }
        })
    }

    //Check email verification time
    static checkEmailVerification = (token: string): Promise<appTypes.dbMatchResponse> =>{
        return new Promise(async(resolve, reject)=>{

            const dbMatchResponse: appTypes.dbMatchResponse = {
                match: false
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    //Get current time
                    const currentTime = super.getCurrentTime();

                    //Check if token exists and has not expired
                    
                    const [queryResult] = await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.checkTokenVerification, 
                        [
                            token,
                            currentTime
                        ]
                    );

                    if(queryResult.length === 1){

                        dbMatchResponse.match = true;      
                        dbMatchResponse.matchTerm = queryResult;          
                        resolve(dbMatchResponse);

                    } else if (queryResult.length === 0){

                        throw "No matches in email token database."
                    }

                }catch(e){
                    throw e
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                };

            }catch(e){
                console.log(e);
                //If there is some error...
                dbMatchResponse.error = e;
                reject(dbMatchResponse);
                
            }
        })
    };


    //Delete  email verification token
    static deleteEmailVerification = (token: string): Promise<appTypes.APIAccountOperationResponse> =>{
        return new Promise(async(resolve, reject)=>{

            const dbDeleteResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "remove",
                accountOperation: "verify email",
                contentType: "account"
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table


                try{
                    //delete token, email, and token expiry
                    
                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.deleteEmailVerificationToken, 
                        [
                            token
                        ]
                    );

                    dbDeleteResponse.success = true;
                    dbDeleteResponse.message = "operation successful";
                    
                    resolve(dbDeleteResponse);

                }catch(e){
                    throw e
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
                
            }catch(e){

                console.log(e);
                console.log(console.trace()); 

                //If there is some error...
                dbDeleteResponse.error = e;
                reject(dbDeleteResponse);
            }
        })
    }

    //Check email verification time

    static updateVerification =(email: string): Promise<appTypes.APIAccountOperationResponse> => {
        return new Promise(async(resolve, reject)=>{

            const dbUpdateResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "update",
                accountOperation: "verify email",
                contentType: "account"
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    //Update user verification status here
                    
                    await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.accountStatements.updateVerificationStatus, 
                        [
                            email
                        ]
                    );

                    dbUpdateResponse.message = "operation successful";
                    dbUpdateResponse.success = true;
                    
                    resolve( dbUpdateResponse);
                }catch(e){
                    throw e
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                };
                
            }catch(e){

                console.log(e);
                console.log(console.trace())

                //If there is some error...
                dbUpdateResponse = e;
                reject(dbUpdateResponse);
                
            }
        })
    }


}

export default UsersDatabase