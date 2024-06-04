/*
    All API related types, client and backend, are specified here
*/

export type APICallBase = {
    deviceType: "app" | "extension"
    operationType: "update settings" 
    | "translate" 
    | "acknowledgement" 
    | "sync request" 
    | "sync result"
    | "change password" 
    | "delete account" 
    | "upgrade" 
    | "downgrade" 
    | "create account" 
    | "login"
    | "verify email"
    | "API Key"
    | "Authentication"
    requestId: string
    requestTimeStamp: string
    userId: string
    error?: Error

}

export type BaseUserDetails = {
    userId: string
    dataType: DataTypes
}

//When determining the operation type being sent to backend
export type DataTypes = "project" | "entry" | "settings" | "plays" | "login" | "password" | "tags" | "account"

export type OperationTypes= "create" | "update" | "remove" | "get" | "sync"

export type UserData = ProjectDetails | EntryDetails | UserSettings | PlaysDetails | LoginResult


export interface ProjectDetails extends BaseUserDetails {

    projectName: string
    targetLanguage: string
    outputLanguage: string

}

export interface EntryDetails extends BaseUserDetails {
    targetLanguageText: string
    targetLanguage: string
    outputLanguageText: string
    outputLanguage: string
    project: string
    createdAt: string
    updatedAt:  string
    tags: number
    tagsArray: string[]
    username: string
    entryId: string
}

/* Settings */
export interface UserSettings extends BaseUserDetails {
    gameTimerOn: boolean
    gameNoOfTurns: number
    defaultTargetLanguage: string
    defaultOutputLanguage: string
    defaultProject: string
}


/* Plays */
export interface PlaysDetails extends BaseUserDetails {

    playsLeft: number
    playsRefreshTime: string
   
}


export type OperationWrapper ={
    operationType: OperationTypes
    userData?: UserData | string //Can be ids
    dataType: DataTypes
}



/* 
    Account operations and API wrapper
*/

export interface APIAccountObject<T extends AccountOperationDetails> extends APICallBase {
    accountOperationDetails: T

}

export type AccountOperationDetails = APICreateAccount | APIDeleteAccount | APIDowngradeUser | APIUpgradeUser | APIUpdatePassword  | APILoginResult
       
export interface APIDeleteAccount extends BaseUserDetails {

    password: string

}

export interface APIUpdatePassword extends BaseUserDetails {

    oldPassword: string
    newPassword: string

}

export type APICreateAccount = {

    username: string
    password: string
    email: string
    deviceType: "app" | "extension"

}

/* login and content sync and API wrapper */

export interface LoginResult extends BaseUserDetails {

    loginSuccess: boolean
    username: string | ""
    identifierType: "email" | "username" | ""
    password: string| ""
    
}

export type SyncBufferContents = {

    contentQueue: Array<OperationWrapper | null>
    acknowledgements: Array<FEAcknowledgement | null>
    responseQueue: Array<LocalBackendSyncResult | null>
    syncQueue:Array<LocalSyncRequest<APIContentCallDetails>>

}

export type SyncBufferUserContent = {

    contentQueue: Array<OperationWrapper | null>
    acknowledgements: Array<FEAcknowledgement | null>
    responseQueue: Array<LocalBackendSyncResult | null>

}



                            
export type APIContentCallDetails = SyncBufferUserContent  |    LocalBackendSyncResult                         



/* Details to frontend of changes to send to the backend */
export interface LocalSyncRequest<T extends APIContentCallDetails> extends APICallBase {
    requestDetails: T //Local sync contents (settings, acks, response queue) & login results
    syncType: "total sync" | "local changes" | "login"

}

export interface LocalSyncRequestWrapper<T extends APIContentCallDetails> extends APICallBase{

    requests: Array<LocalSyncRequest<T>>
    operationType: "sync request" | "login"
    loginContents: LoginResult | null
}



/* Generate API key call */
export type APIGenerateKeyRequest = {
    deviceType: "app" | "extension"
    deviceId: string
}

/* Translation call */
export interface APITranslateCall extends APICallBase {

    targetText: string, 
    targetLanguage: string,
    outputLanguage: string

}

/* FE RESPONSE TO SYNC CHANGES  
    Result of front end syncing up with backend changes 
    Properties set to true mean that operation completed 
    properties set to null mean that that operation did not take place
*/
export interface LocalBackendSyncResult extends APICallBase {
    deletedAccount: boolean | null
    userSettingsSync: boolean | null
    premiumStatusSync: boolean | null
    userContentSync: {
        valid: boolean
        failedContent?: Array<any>
        failedContentIndex?: number
    } | null
    syncType: "total sync" | "partial sync" | "account deletion"
}


/* THESE ARE BACKEND RESPONSES */
//BACKEND Responses

/* ALL backend responses will follow this structure */
export interface BackendOperationResponse<T = null> extends APICallBase {
    success: Boolean
    requestIds: Array<string> | null
    errorType?: 
    "User exists"
    | "Miscellaneous error"
    | "Verification token expired"
    | "Invalid token"
    | "Password incorrect"
    | "User not verified"
    | "Device not authorised"
}

export interface APITranslateResponse extends BackendOperationResponse {

    success: boolean
    translations: any[]
    translationsLeft: number
    translationRefreshTime: number

}

export interface APIKeyOperationResponse<T = null> extends BackendOperationResponse<T> {

    APIKey: string

}


/* Result of backend syncing up with local changes */
export interface BackendLocalSyncResult<T=null> extends BackendOperationResponse<T> {

    syncType: "total sync" | "local changes" | "login"

    //If user account details needs to be synced
    userAccountChanges: boolean
    userAccountDetails: APIAccountChanges | {}

    //Only if buffer content needs to be synced
    partialSyncRequired: boolean
    syncContent: Array<OperationWrapper | null> //Chronological list of user entry and project operations

    //If full sync required
    databaseContents: BackendContent | {}
    fullSyncRequired: boolean
}

export type BackendContent = {
    projects: Array<ProjectDetails | null>
    entries: Array<EntryDetails | null>
    tags: Array<null>
}


export type AccountDetails = {
    //When user logs in, front end is updated with any changes that have occurred with the account elsewhere
    userSettings: UserSettings | null
    userPremiumStatus: boolean | null
    userDeleted: boolean | null
    userVerified: boolean | null
}

/* Entries from backend extension buffer */
export type UserContentExtensionBuffer = {
    operationType: "add" | "update" | "get" | "delete"
    contentType: "tags" | "entry" | "project"
    userContent: EntryDetails | ProjectDetails
}



/* Acknowledgements */

export interface FEAcknowledgement extends APICallBase {
}

export interface BEAcknowledgement extends APICallBase {

}

/* CUSTOM REQUEST AN RESPONSE TYPES */
// Extend the Express Response interface
import { Request, Response } from 'express-serve-static-core';

export interface LocalSyncRequestCall extends Request {
    body: LocalSyncRequestWrapper<SyncBufferUserContent>
}

export interface BackendSyncResultResponse extends Response {
    resBody: BackendLocalSyncResult
}

export interface LocalSyncResponse extends Request {
    body: LocalBackendSyncResult
}

export interface Acknowledgement extends Response {
    resBody: BEAcknowledgement
}


export interface CreateAccountCall extends Request {
    body: APIAccountObject<APICreateAccount>
}

export interface CreateAccountResponse extends Response {
    resBody: BackendOperationResponse
}

export interface DeleteAccountCall extends Request {
    body: APIAccountObject<APIDeleteAccount>
}

export interface DeleteAccountResponse extends Response {
    resBody: BackendOperationResponse
}

export interface VerifyEmailResponse  extends Response {
    resBody: BackendOperationResponse
}

export interface UpdatePasswordCall extends Request {
    body: APIAccountObject<APIUpdatePassword>
}

export interface UpdatePasswordResponse extends Response {
    resBody: BackendOperationResponse
}