import * as mysql from "mysql2"


    export type UserCredentials = {
        username?: string
        password?: string
        email?: string,
        deviceId?: string,
        apiKey?: string,

        identifierType?: "email" | "username"
    }

    export type userRequest = {
        target_text: string
        target_text_lang: string
        output_lang: string
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


    //User content posts

    export type ProjectDetails = {

        projectName: string
        targetLanguage: string
        outputLanguage: string
        userId: string

    }

    export type EntryDetails = {
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

    //User settings object
    export type UserSettings = {
        gameTimerOn: boolean
        gameNoOfTurns: number
        defaultTargetLanguage: string
        defaultOutputLanguage: string
        defaultProject: string
        userId: string
    }

    export type refreshErrorResponse ={

        responseMessage: "Refresh complete" | "Refresh unsuccessful"
        info: string

    }

    //User verification

    export type EmailVerificationResponse = {

        responseMessage: "Check complete" | "Check unsuccessful"
        info: string
        errorMessage?: Error | null
    }


    //API related

    /*
        API responses relate to responses of operations that occur on the backend. API objects 
        also relate to information passed from the front end to the backend.These much match the
        type definitions defined for the frontend.
    */

    export type APIOperationResponse = {
        success: Boolean
        message: "no internet" | "operation successful" | "misc error" | "operation unsuccessful"
        error?: Error
        operationType: "create" | "update" | "remove" | ""
        contentType : "project" | "tags" | "entry" | "account" | "settings"
        customResponse: string
    }

    export interface APIAccountOperationResponse extends APIOperationResponse {
        accountOperation: "change password" | "delete account" | "upgrade" | "downgrade" | "create account" | "verify email" | "login"
        userId?: string
    }

    
    export type APIDeleteAccount = {
    
        user: string
        password: string
    
    }
    
    export type APIUpdatePassword = {

        userId: string
        oldPassword: string
        newPassword: string
    
    }
    
    export type APICreateAccount = {
    
        username: string
        password: string
        email: string
    
    }
    
    export type APIUpgradeUser = {
    
    }
    
    export type APIDowngradeUser = {
    
    }

    export type APILoginUser = {

        loginSuccess: boolean;
        username: string;
        identifierType: "" | "email" | "username";
        password: string;
    
    }


    export type APITranslateCall = {

        targetText: string, 
        targetLanguage: string,
        outputLanguage: string,
        username: string
    }
    
    export type APITranslateResponse = {
    
        success: boolean
        translations: any[]
        translationsLeft: number
        translationRefreshTime: number
        message: "no internet" | "operation successful" | "misc error" | "operation unsuccessful"
    
    }

    export type TranslationsLeft ={
        translationsLeft: number
        translationRefreshTime: number
    }

    //Generic API Request
export type APIRequest = {

    requestType: "account" | "settings" | "project" | "entry" | "translate" | "tags"
    requestDetails: APIEntryObject | APIProjectObject | APITranslateCall | APIAccountObject<AccountOperationDetails> | APISettingsObject

}


