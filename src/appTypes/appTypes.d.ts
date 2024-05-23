import { extend } from "dayjs"
import * as mysql from "mysql2"


    export type UserCredentials = {
        username?: string
        password?: string
        email?: string,
        deviceId?: string,
        apiKey?: string,

        identifierType?: "email" | "username"
    }

    //Response template for database searches

    export type ResponseObject<responseCodeOptions extends number, messageOptions extends string> = {

        responseCode: responseCodeOptions
        responseMessage: messageOptions

    }

    //Response template for connection

    export type DBResponseObject<DBResponseObjectConfig extends Record<string, any>> = 
    
        ResponseObject<DBResponseObjectConfig["responseCodeOptions"], DBResponseObjectConfig["responseMessageOptions"]> & {
            mysqlConnection?: DBResponseObjectConfig["mysqlConnection"];
    }   

    export type DBResponseObjectConfig = {
        responseCodeOptions: 0 | 1 | 2
        responseMessageOptions: "Connection successful" | "Connection unsuccessful"
        mysqlConnection: mysql.PoolConnection | null
    }

    //DB response template for matching in database

    export type dbMatchResponse = {
        match: boolean
        error?: Error | string
        matchTerm?: string
        matchColumn?: string
    }

    //DB Response template for adding user entry

    export type DBAddUserResponseObject<DBAddResponseConfig extends Record<string, any>> = 

        ResponseObject<DBAddResponseConfig["responseCodeOptions"], DBAddUserResponseConfig["responseMessageOptions"]> & {
           addMessage: DBAddUserResponseConfig["addMessage"];

    }

    export type DBAddUserResponseConfig = {
        responseCodeOptions: 0 | 1 | 2
        responseMessageOptions: "New user added" | "New user could not be added"
        addMessage: string
        
    }



     //DB Response template for updating user password

     export type DBUpdatePasswordResponseObject<DBUpdatePasswordResponseConfig extends Record<string, any>> = 

     ResponseObject<DBUpdatePasswordResponseConfig["responseCodeOptions"], DBUpdatePasswordResponseConfig["responseMessageOptions"]> & {
        updateMessage: DBUpdatePasswordResponseConfig["updateMessage"];

 }

 export type DBUpdatePasswordResponseConfig = {
     responseCodeOptions: 0 | 1 | 2
     responseMessageOptions: "Password updated successfully" | "Password could not be updated"
     updateMessage: string
     
 }

 //DB Response template for upgrading user

 export type DBUpgradeResponseObject<DBUpgradeResponseConfig extends Record<string, any>> = 

 ResponseObject<DBUpgradeResponseConfig["responseCodeOptions"], DBUpgradeResponseConfig["responseMessageOptions"]> & {
    updateMessage: DBUpgradeResponseConfig["updateMessage"];

}

export type DBUpgradeResponseConfig = {
 responseCodeOptions: 0 | 1 | 2
 responseMessageOptions: "Upgrade successful" | "upgrade unsuccessful"
 updateMessage: string
 
}

//DB Response template for updating user password

export type DBUpdateResponseObject<DBUpdateResponseConfig extends Record<string, any>> = 

ResponseObject<DBUpdateResponseConfig["responseCodeOptions"], DBUpdateResponseConfig["responseMessageOptions"]> & {
   updateMessage: DBUpdateResponseConfig["updateMessage"];

}

export type DBUpdateResponseConfig = {
responseCodeOptions: 0 | 1 | 2
responseMessageOptions: "Update successful" | "Update unsuccessful"
updateMessage: string

}

//Add new content

export type DBAddResponseObject<DBAddResponseConfig extends Record<string, any>> = 

ResponseObject<DBUpdateResponseConfig["responseCodeOptions"], DBAddResponseConfig["responseMessageOptions"]> & {
   addMessage: DBAddResponseConfig["addMessage"]
   addType: DBAddResponseConfig["addType"];

}

export type DBAddResponseConfig = {
responseCodeOptions: 0 | 1 | 2
responseMessageOptions: "Add successful" | "Add unsuccessful"
addMessage: string
addType: "project" | "entry" | "tag"
}

//Request translation

export type TranslationResponseObject<TranslationResponseConfig extends Record<string, any>> = 

ResponseObject<TranslationResponseConfig["responseCodeOptions"], TranslationResponseConfig["responseMessageOptions"]> & {
   translationMessage: TranslationResponseConfig["translationMessage"]

}

export type TranslationResponseConfig = {
responseCodeOptions: 0 | 1 | 2
responseMessageOptions: "Translation successful" | "Translation unsuccessful"
translationMessage: string
}

//Delete content

export type DBDeleteResponseObject<DBDeleteResponseConfig extends Record<string, any>> = 

ResponseObject<DBDeleteResponseConfig["responseCodeOptions"], DBDeleteResponseConfig["responseMessageOptions"]> & {
   deleteMessage: DBDeleteResponseConfig["deleteMessage"]
   deleteType: DBDeleteResponseConfig["deleteType"];

}

export type DBDeleteResponseConfig = {
responseCodeOptions: 0 | 1 | 2
responseMessageOptions: "Delete successful" | "Delete unsuccessful"
deleteMessage: string
deleteType: "project" | "entry" | "tag"
}


    //Database searches object

    export type DBSearchObject<DBSearchConfig extends Record<string, any>> = {
        mysqlConnection: DBSearchConfig["mysqlConnection"]
        table: DBSearchConfig["tables"]
        sqlStatement?: string
        matchTerms?: Array<MatchTerms>
    }
    export type MatchTerms<DBType extends string> = {
        term: string
        column: DBType
    }

    //DB Columns 

    export type UsersTableColumns = "id" | "username" | "email" | "password_hash" | "created_at" | "updated_at"

    export type APIKeysTableColumns = "api_key"

    export type UsersLoginsDB = {
        mysqlConnection: mysql.Connection
        tables: "users" | "api_keys" | "verification"
        userCredentials?: UserCredentials
    }

    export type UserContentDB = {
        mysqlConnection: mysql.Connection
        tables: "entry_tags" | "projects" | "user_entries" | "user_tags"
    }

    export type  UserDetailsDB = {
        mysqlConnection: mysql.Connection
        tables: "next_plays_refresh" | "next_translations_refresh" | "plays_left" | "premium_users" | "translations_left" | "user_details" | "user_settings"
    }


    //API 

    /* User API call content */
    export type APICallBase = {

        deviceType: "app" | "extension"
        operationType: "project" | "tags" | "entry" | "account" | "settings"

    }

    export interface ProjectDetails extends APICallBase {

        //Creating or removing a project
        projectName: string
        targetLanguage: string
        outputLanguage: string
        userId: string

    }

    export interface EntryDetails extends APICallBase {

        //Adding or editing an entry 
        targetLanguageText: string
        targetLanguage: string
        outputLanguageText: string
        outputLanguage: string
        project: string
        createdAt: string
        updatedAt:  string
        tags: number
        tagsArray: string[]
        userId: string
        username: string
        entryId: string
    }

    export interface UserSettings extends APICallBase {

        //Setting user settings
        gameTimerOn: boolean
        gameNoOfTurns: number
        defaultTargetLanguage: string
        defaultOutputLanguage: string
        defaultProject: string
        userId: string
    }

    export interface APITranslateCall extends APICallBase {

        //COntent to translate
        targetText: string, 
        targetLanguage: string,
        outputLanguage: string,
        username: string
        userId: string
    }

    /* Account-related API calls */

    export interface APIDeleteAccount extends APICallBase {
    
        user: string
        password: string
    
    }
    
    export interface APIUpdatePassword extends APICallBase {

        userId: string
        oldPassword: string
        newPassword: string
    
    }
    
    export interface APICreateAccount extends APICallBase {
    
        username: string
        password: string
        email: string
    
    }
    
    export type APIUpgradeUser = {
    
    }
    
    export type APIDowngradeUser = {
    
    }

    export interface APILoginResult extends APICallBase {

        loginSuccess: boolean;
        username: string;
        identifierType: "" | "email" | "username";
        password: string
        userId: string
    
    }

    
    /* Plays */

    export interface PlaysDetails extends APICallBase {

        playsLeft: string
        playsRefreshTime: string
        userId: string
    
    }

    /* API operation responses to front end*/
    export type APIOperationResponse<T = null> = {
        //Generic response for call API operations
        success: Boolean
        message: "no internet" | "operation successful" | "misc error" | "operation unsuccessful"
        error?: Error
        operationType: "create" | "update" | "remove" | "get"
        contentType : "project" | "tags" | "entry" | "account" | "settings" | "buffer"
        customResponse?: T
    }

    export interface APIAccountOperationResponse<T = null> extends APIOperationResponse<T>  {
        //Generic response for all account related API operations
        accountOperation: "change password" | "delete account" | "upgrade" | "downgrade" | "create account" | "verify email" | "login" 
        userId?: string
    }

    export interface APIKeyOperationResponse<T = null> extends APIOperationResponse<T> {

        apiOperationType: "generate api key"
        APIKey: string

    }

    export type APITranslateResponse = {
        //Specifically for translation calls
        success: boolean
        translations: any[]
        translationsLeft: number
        translationRefreshTime: number
        message: "no internet" | "operation successful" | "misc error" | "operation unsuccessful"
    
    }

    export type APIPostLoginSetUp = {
        //When user logs in, front end is updated with any changes that have occurred with the account elsewhere
        userId: string
        userSettings: UserSettings
        userPremiumStatus: boolean
        userDeleted:  {
            userId: string
            valid: boolean
        }
        userContent: [] //Chronological list of user entry and project operations
    }

    export type APIGenerateKeyRequest = {
        deviceType: "app" | "extension"
        deviceId: string
    }


    export type refreshErrorResponse ={

        responseMessage: "Refresh complete" | "Refresh unsuccessful"
        info: string

    }

    export type EmailVerificationResponse = {

        responseMessage: "Check complete" | "Check unsuccessful"
        info: string
        errorMessage?: Error | null
    }


    export type TranslationsLeft ={
        translationsLeft: number
        translationRefreshTime: number
    }

    //Generic API Request


    //BUFFER INFORMATION

    export type UserDeviceCreds = {
        userId: string
        deviceType: "app" | "extension"
    }

    export interface BufferOperationResponse<T = null> extends APIOperationResponse<T> {

    }

    /* Entries from backend extension buffer */
    export type UserContentExtensionBuffer = {
        operationType: "add" | "update" | "get" | "delete"
        contentType: "tags" | "entry" | "project"
        userContent: EntryDetails | ProjectDetails
    }




