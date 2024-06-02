import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from '@appTypes/api';
import vpModel from "@shared/models/models_template";
declare class UserDetailsDatabase extends vpModel {
    static addNewUserDetails(userCredentials: apiTypes.APICreateAccount, userId: string, deviceId: string): Promise<appTypes.DBOperation>;
    static updateUserSettings: (settingsObject: apiTypes.UserSettings) => Promise<appTypes.DBOperation>;
    static getUserSettings: (userId: string) => Promise<appTypes.DBOperation<apiTypes.UserSettings>>;
    static checkPremiumStatus: (userId: string) => Promise<appTypes.DBOperation<boolean>>;
    static updateLastLoggedIn(userId: string): Promise<appTypes.DBOperation>;
    static checkTranslationsLeft(username: string): Promise<boolean>;
    static getTranslationTimeLeft(username: string): Promise<number>;
    static updateTranslationsLeft(username: string): Promise<appTypes.TranslationsLeft>;
    static updatePlaysLeft(playsDetails: apiTypes.PlaysDetails): Promise<appTypes.DBOperation>;
}
export default UserDetailsDatabase;
