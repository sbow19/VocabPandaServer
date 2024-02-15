import * as appTypes from "@appTypes/appTypes";
declare class vpModel {
    constructor();
    static generateUUID(): string;
    static hash(): void;
    static getCurrentTime(): any;
    static getMembershipEndTime(): any;
    static getTranslationRefreshEndTime(): any;
    static getUsersDetailsDBConnection(): Promise<appTypes.DBResponseObject<appTypes.DBResponseObjectConfig>>;
    static getUsersContentDBConnection(): Promise<appTypes.DBResponseObject<appTypes.DBResponseObjectConfig>>;
    static getUsersDBConnection(): Promise<appTypes.DBResponseObject<appTypes.DBResponseObjectConfig>>;
    static getUserId(username: string): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>;
}
export default vpModel;
