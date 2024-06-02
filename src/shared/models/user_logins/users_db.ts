import * as appTypes from "@appTypes/appTypes"
import * as apiTypes from "@appTypes/api"
import vpModel from "@shared/models/models_template";
import preparedSQLStatements from "../prepared_statements";
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
import mysql, {ResultSetHeader, RowDataPacket} from 'mysql2/promise'
const bcrypt = require('bcrypt');
const UserDBPool = require("./users_db_pool");


class UsersDatabase extends vpModel {


    //Create new user + connection and match attempt
    static createNewUser(userCredentials: apiTypes.APICreateAccount, deviceCredentials): Promise<appTypes.DBOperation<string>>{

        //Attempt to get db connection
        return new Promise(async(resolve, reject)=>{


            const createUserResponse: appTypes.DBOperation<string> = {
                success: false,
                operationType: "DB Add User",
                resultArray: "",
                specificErrorCode: ""
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{
                    
                    //New user id
                    const newUserId = super.generateUUID();

                    await connectionResponseObject.mysqlConnection?.beginTransaction();
                    
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
                    createUserResponse.resultArray = newUserId; //Send the user id back to add new details

                    resolve(createUserResponse);
                        
                }catch(e){
                    //If the username or email already exists, then we will get a duplicate error
                    console.log("SQL ERROR, creating new user", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //Release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }

                

            }catch(e){

                if(e.code === "ER_DUP_UNIQUE"){
                    //If an error code exists
                    createUserResponse.specificErrorCode = e.code;
                    reject(createUserResponse);
                }else if (e.code){
                    createUserResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    createUserResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                
            }
        })

    }

    //Delete user
    static deleteUser(userCredentials: apiTypes.APIDeleteAccount): Promise<appTypes.DBOperation>{

        return new Promise(async(resolve, reject)=>{

            const deleteUserResponse: appTypes.DBOperation = {
                operationType: "DB Delete User",
                success: false,
                specificErrorCode: "",
                resultArray: null
            };

            try{

                const dbConnection = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    dbConnection.mysqlConnection?.beginTransaction()
                    
    
                    const [databaseResult, ] = await dbConnection.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.generalStatements.userIdMatch
                        , 
                        [
                            userCredentials.userId,
                            userCredentials.userId
                        ]);
                    

   
                    if(await bcrypt.compare(userCredentials.password, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        deleteUserResponse.specificErrorCode = "Password does not match ";
                        reject(deleteUserResponse);
                        return
                    } 
                    

                    //IF match found in checking for users, then account can be deleted. 
                
                    const [queryResult, ] = await dbConnection.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.accountStatements.deleteAccount, 
                        [
                            userCredentials.userId,
                            userCredentials.userId

                        ])

                    dbConnection.mysqlConnection?.commit();

                    if(queryResult.affectedRows === 0){
                        //Both tables need to be updated
                        deleteUserResponse.specificErrorCode = "No rows affected";
                        reject(deleteUserResponse);

                    } else if (queryResult.affectedRows > 0){
                        deleteUserResponse.success = true;
                        resolve(deleteUserResponse);
                    }


                }catch(e){
                    //If the username or email already exists, then we will get a duplicate error
                    console.log("SQL ERROR, deleting user", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{

                    //Release 
                    UserDBPool.releaseConnection(dbConnection.mysqlConnection);

                }              

            }catch(e){
                if (e.code){
                    deleteUserResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    deleteUserResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                
            }
        })
    };

    //Update password
    static updatePassword(accountObject: apiTypes.APIUpdatePassword): Promise<appTypes.DBOperation>{
        return new Promise(async(resolve, reject)=>{



            const updatePasswordResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Update Password",
                specificErrorCode: "",
                resultArray: null
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{
                             
                    connectionResponseObject.mysqlConnection?.beginTransaction();
                    
    
                    const [databaseResult, ] = await connectionResponseObject.mysqlConnection?.query(
                        preparedSQLStatements.generalStatements.userIdMatch
                        , 
                    accountObject.userId);
                    

                    //if there is a positive match, then the user exists, we will then check the hash    
                    
                    if(await bcrypt.compare(accountObject.oldPassword, databaseResult[0].password_hash)){
                        //match successful Leave empty, continue
                    } else {
                        reject(updatePasswordResponse);
                        return
                    } 

                    //Generate new hashed password

                    const salt = await bcrypt.genSalt();
                    const hashedPassword = await bcrypt.hash(accountObject.newPassword, salt);
                    
                    //new password_hash, username

                    const [changeResult, ] = await connectionResponseObject.mysqlConnection.query<ResultSetHeader>(
                        preparedSQLStatements.accountStatements.updatePassword,
                        [hashedPassword, accountObject.userId]
                    );
                    
                    if(changeResult.affectedRows === 0){
                        //Both tables need to be updated
                        updatePasswordResponse.specificErrorCode = "No rows affected";
                        reject(updatePasswordResponse);

                    } else if (changeResult.affectedRows > 0){
                        updatePasswordResponse.success = true;
                        resolve(updatePasswordResponse);
                    }

                }catch(e){
                    console.log("SQL ERROR, changing password", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;

                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                } 

            }catch(e){

                if (e.code){
                    updatePasswordResponse.specificErrorCode = e.code;
                    reject(updatePasswordResponse);
                }else{
                    updatePasswordResponse.specificErrorCode = "Unknown error";
                    reject(updatePasswordResponse);
                }
                
            }
        })
    }

    static isCorrectPassword(loginResult: apiTypes.LoginResult): Promise<appTypes.DBOperation>{
        return new Promise(async(resolve, reject)=>{



            const correctPasswordResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Compare Password",
                specificErrorCode: "",
                resultArray: null
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{
                             
                    connectionResponseObject.mysqlConnection?.beginTransaction();
                    
    
                    const [databaseResult, ] = await connectionResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.generalStatements.usersUsernameMatch
                        , 
                        loginResult.username);
                    
                    
                    if(databaseResult.length === 0){
                        //Both tables need to be updated
                        correctPasswordResponse.specificErrorCode = "No rows affected";
                        reject(correctPasswordResponse);

                    } else if (databaseResult.length === 1){
                        //if there is a positive match, then the user exists, we will then check the hash    
                    
                        if(await bcrypt.compare(loginResult.password, databaseResult[0].password_hash)){
                            //match successful Leave empty, continue
                            correctPasswordResponse.success = true;
                            resolve(correctPasswordResponse);
                        } else {
                            reject(correctPasswordResponse);
                        }
                    }

                }catch(e){
                    console.log("SQL ERROR, Fetching password", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;

                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                } 

            }catch(e){

                if (e.code){
                    correctPasswordResponse.specificErrorCode = e.code;
                    reject(correctPasswordResponse);
                }else{
                    correctPasswordResponse.specificErrorCode = "Unknown error";
                    reject(correctPasswordResponse);
                }
                
            }
        })
    }

    //Save email verification token
    static saveEmailVerification(token: string, email: string): Promise<appTypes.DBOperation>{
        return new Promise(async(resolve, reject)=>{

            const addEmailTokenResponse: appTypes.DBOperation = {
                success: false,
                specificErrorCode: "",
                operationType: "Save Email Verification Token",
                resultArray: null
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
                    resolve(addEmailTokenResponse);

                }catch(e){
                    //If the username or email already exists, then we will get a duplicate error
                    console.log("SQL ERROR, error saving email token", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{

                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
            
            }catch(e){

                if (e.code){
                    addEmailTokenResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    addEmailTokenResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        })
    }

    //Get ID from verification token
    static getEmailFromToken = (token: string): Promise<appTypes.DBOperation<string>> =>{
        return new Promise(async(resolve, reject)=>{

            const getEmailResponse: appTypes.DBOperation<string> = {

                resultArray: "",
                success: false,
                operationType: "Get Email From Token",
                specificErrorCode: ""
                
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table


                try{
                    //delete token, email, and token expiry
                    
                    const [resultRow,] = await connectionResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.accountStatements.deleteEmailVerificationToken, 
                        [
                            token
                        ]
                    );

                    if(resultRow.length === 0){

                        getEmailResponse.specificErrorCode = "No rows affected"
                        reject(getEmailResponse)

                    }else if (resultRow.length === 1){

                        const email: string = resultRow[0]["email"];

                        getEmailResponse.resultArray = email;
                        getEmailResponse.success = true;

                        resolve(getEmailResponse);
                    }

                }catch(e){
                    console.log("SQL ERROR, fetching email with verification token", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
                
            }catch(e){

                if (e.code){
                    getEmailResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    getEmailResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        })
    }
    //Delete  email verification token
    static deleteEmailVerification = (token: string): Promise<appTypes.DBOperation> =>{
        return new Promise(async(resolve, reject)=>{

            const TokenDeleteResponse: appTypes.DBOperation = {
                success: false,
                operationType: "Delete Verification Token",
                specificErrorCode: "",
                resultArray: null
                
            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table


                try{
                    //delete token, email, and token expiry
                    
                    const [deleteResponse, ] = await connectionResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.accountStatements.deleteEmailVerificationToken, 
                        [
                            token
                        ]
                    );

                    if(deleteResponse.rowsAffected === 0){
                        //Failed to delete a token
                        TokenDeleteResponse.specificErrorCode = "No rows affected"
                    }else if (deleteResponse.rowsAffected === 1){
                        TokenDeleteResponse.success = true;
                        resolve(TokenDeleteResponse);
                    }
                    

                }catch(e){
                    console.log("SQL ERROR, delete email token", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                }
                
            }catch(e){

                if (e.code){
                    TokenDeleteResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    TokenDeleteResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
            }
        })
    }

    //Check email verification time
    static updateVerification =(email: string): Promise<appTypes.DBOperation> => {
        return new Promise(async(resolve, reject)=>{

            const updateResponse: appTypes.DBOperation = {
                success: false,
                resultArray: null,
                specificErrorCode: "",
                operationType: "Update Verification Status"

            };

            try{

                const connectionResponseObject = await super.getUsersDBConnection(); //Get connection to user_logins table

                try{

                    //Update user verification status here
                    
                    const [updateResult, ] = await connectionResponseObject.mysqlConnection?.query<ResultSetHeader>(
                        preparedSQLStatements.accountStatements.updateVerificationStatus, 
                        [
                            email
                        ]
                    );

                    if(updateResult.rowsAffected === 0){
                        //Failed to update verification status
                        updateResponse.specificErrorCode = "No rows affected"
                    }else if (updateResult.rowsAffected === 1){
                        updateResponse.success = true;
                        resolve(updateResponse);
                    }

                }catch(e){
                    console.log("SQL ERROR, update verification status", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    //release pool connection
                    UserDBPool.releaseConnection(connectionResponseObject.mysqlConnection);
                };
                
            }catch(e){

                if (e.code){
                    updateResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    updateResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                
            }
        })
    }

    //Get user verif status
    static getVerificationStatus = (userId: string): Promise<appTypes.DBOperation<boolean>> =>{
        return new Promise(async(resolve, reject)=>{

            const fetchResult: appTypes.DBOperation<boolean> = {
                success: false,
                resultArray: false,
                specificErrorCode: "",
                operationType: "Get Verification Status"

            }

            try{

                //Get db connection
                const dbResponseObject = await super.getUsersDBConnection();

                try{
                    //Begin transaction
                    await dbResponseObject.mysqlConnection?.beginTransaction();

                    const [queryResponse, ] = await dbResponseObject.mysqlConnection?.query<RowDataPacket[]>(
                        preparedSQLStatements.accountStatements.getVerificationStatus,
                        [
                            userId
                        ]
                    )
                    
                    await dbResponseObject.mysqlConnection?.commit(); // end add new project transaction
                    
                    if(queryResponse.affectedRows === 0){
                        //No user found 
                        reject(fetchResult);

                    } else if (queryResponse.affectedRows > 0){
                        //User found

                        if(queryResponse[0].verified === 1){
                            fetchResult.resultArray = true;
                        }else if(queryResponse[0].verified === 0){
                            fetchResult.resultArray = false
                        }

                        fetchResult.success = true;

                        resolve(fetchResult)
                    }

                }catch(e){
                    console.log("SQL ERROR, fetching premium", e)
                    const sqlError = e as mysql.QueryError;
                    throw sqlError;
                }finally{
                    UserDBPool.releaseConnection(dbResponseObject.mysqlConnection);
                }

            }catch(e){
                if(e.code){
                    //If an error code exists
                    fetchResult.specificErrorCode = e.code;
                    reject(fetchResult);
                }else{
                    e.specificErrorCode = "Unknown error"
                    reject(fetchResult);
                };

            }

        })
    }

    //Get account details
    static getAccountDetails = (userId: string): Promise<appTypes.DBOperation<apiTypes.AccountDetails>>=>{
        return new Promise(async(resolve, reject)=>{



            const getAccountDetailsResponse: appTypes.DBOperation<apiTypes.AccountDetails> = {
                success: false,
                operationType: "Update Password",
                specificErrorCode: "",
                resultArray: {
                    userSettings: {},
                    userPremiumStatus: null,
                    userVerified: null
                }
            };

            //Fetch Account settings
            try{

                const settingsGetResult = await UserDetailsDatabase.getUserSettings(userId);
                getAccountDetailsResponse.resultArray.userSettings = settingsGetResult.resultArray; 

            }catch(e){

                if (e.code){
                    getAccountDetailsResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    getAccountDetailsResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                return

            }

            //Fetch premium status
            try{

                const premiumGetResult = await UserDetailsDatabase.checkPremiumStatus(userId);
                getAccountDetailsResponse.resultArray.userPremiumStatus = premiumGetResult.resultArray; 

            }catch(e){

                if (e.code){
                    getAccountDetailsResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    getAccountDetailsResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                return

            }

            //Fetch verification status
            try{

                const verificationGetResult = await this.getVerificationStatus(userId);

                if(verificationGetResult.resultArray === false){

                    getAccountDetailsResponse.resultArray.userVerified = verificationGetResult.resultArray;
                    getAccountDetailsResponse.specificErrorCode = "User not verified"
                    reject(verificationGetResult)

                } else if (verificationGetResult.resultArray === true){

                    getAccountDetailsResponse.resultArray.userVerified = verificationGetResult.resultArray;

                }

            }catch(e){

                if (e.code){
                    getAccountDetailsResponse.specificErrorCode = e.code;
                    reject(e);
                }else{
                    getAccountDetailsResponse.specificErrorCode = "Unknown error";
                    reject(e);
                }
                return

            }

            resolve(getAccountDetailsResponse);
        })
    }

}

export default UsersDatabase