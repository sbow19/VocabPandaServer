import * as mysql from "mysql2/promise"
import * as apiTypes from '@appTypes/api'


    export type UserCredentials = {
        username?: string
        password?: string
        email?: string,
        deviceId?: string,
        apiKey?: string,

        identifierType?: "email" | "username"
    }

    //DB response

    export interface DBFlagCheck extends DBOperation {

        fullSyncRequired: boolean

    }

    export interface DBOperation<T = null> extends BackendOperation {
        specificErrorCode: 
        //MYsql server  errors
            'ER_ACCESS_DENIED_ERROR'
            |"ER_DUP_UNIQUE" //Unique constraint failed in table
        
        //NOde js errors
            |'ECONNREFUSED'
        
        //Internal errors
            |'PROTOCOL_CONNECTION_LOST'
        
        //MISC errors
            | string
            | "No rows affected"
            | "Unknown error"
            | "Password does not match"
            | "User not verified"
        resultArray: T
    }

    //Response template for connection
    export interface DBConnectionObject extends BackendOperation {
        message: "Connection successful" | "Connection unsuccessful"
        mysqlConnection: mysql.PoolConnection | null
    }

    //DB response template for matching in database

    export type dbMatchResponse = {
        match: boolean
        error?: Error | string
        matchTerm?: string
        matchColumn?: string
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


    /* SYNCING PROCESSING */

    export interface LocalContentParsingResult extends BackendOperation {
        localContent: boolean
        contentArray: Array<apiTypes.OperationWrapper | null> | null
    }

    export interface PushLocalContentResult extends BackendOperation {
        dbError: //MYsql server  errors
        'ER_ACCESS_DENIED_ERROR'
        |"ER_DUP_UNIQUE" //Unique constraint failed in table
    
    //NOde js errors
        |'ECONNREFUSED'
    
    //Internal errors
        |'PROTOCOL_CONNECTION_LOST'
    
    //MISC errors
        | string
        | "No rows affected"
        | "Unknown error"
    }

    export type BackendOperation = {  //For backend use only

        success: boolean
        operationType: "Parse content queue" 
        |"Push local content db" 
        |"Push local content buffer"
        |"DB Content Operation"
        |"DB Connection"
        //DB User account operaions
        | "DB Add User"
        | "DB Delete User"
        | "Update Password"
        | "Compare Password"
        | "Get Premium Status"
        | "Get Verification Status"
        | "Update Last Logged In"

        //DB Content Operations
        |"DB Plays Operation"
        |"DB Translations Operation"
        |"DB Project Operation"
        |"DB Entry Operation"
        |"DB Settings Operation"
        |"DB Tags Operation"

        //Buffer operations
        | "Fetch Buffer"
        | "Clear buffer"

        //Sync operations
        | "Set Sync Flag"
        | "Fetch All Content"
        | "Prepare Full Sync Content"

        //Verification
        |"Send Verification Email"
        | "Save Email Verification Token"
        | "Check Verification Token"
        | "Get Email From Token"
        | "Delete Verification Token"
        | "Update Verification Status"
        
        //CRON operations
        |"Plays Refresh Check"
        |"Translations Refresh Check"
        |"Premium User Check"
        |"Email Verification Check"
    }









