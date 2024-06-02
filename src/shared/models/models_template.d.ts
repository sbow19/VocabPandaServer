import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from '@appTypes/api';
declare class vpModel {
    constructor();
    static generateUUID(): string;
    static getCurrentTime(): any;
    static getMembershipEndTime(): any;
    static getTokenExpiry(): any;
    static getTranslationRefreshEndTime(): any;
    static getUsersDetailsDBConnection(): Promise<appTypes.DBConnectionObject>;
    static getUsersContentDBConnection(): Promise<appTypes.DBConnectionObject>;
    static getUsersDBConnection(): Promise<appTypes.DBConnectionObject>;
    static getUserSyncDBConnection(): Promise<appTypes.DBConnectionObject>;
    static getUsersBuffersDBConnection(): Promise<appTypes.DBConnectionObject>;
    static getUserId(username: string): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>;
    static userExists(userId: string): Promise<appTypes.dbMatchResponse>;
    static parseLocalContent: (localSyncRequests: apiTypes.LocalSyncRequest<apiTypes.APIContentCallDetails>[]) => Promise<appTypes.LocalContentParsingResult>;
}
export default vpModel;
