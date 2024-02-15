import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UserDetailsDatabase extends vpModel {
    static addNewUserDetails(userCredentials: appTypes.UserCredentials, userId: string): Promise<appTypes.DBAddUserResponseObject<appTypes.DBAddUserResponseConfig>>;
    static upgradeToPremium(username: string): Promise<appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig>>;
    static downgradeToFree(username: string): Promise<appTypes.DBUpgradeResponseObject<appTypes.DBUpgradeResponseConfig>>;
    static updateLastLoggedIn(username: string): Promise<appTypes.DBUpdateResponseObject<appTypes.DBUpdateResponseConfig>>;
    static checkTranslationsLeft(username: string): Promise<boolean>;
    static updateTranslationsLeft(username: string): Promise<number>;
}
export default UserDetailsDatabase;
