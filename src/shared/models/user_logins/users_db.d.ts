import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UsersDatabase extends vpModel {
    #private;
    static checkCredentials(userCredentials: {
        name: string;
        pass: string;
    }): Promise<appTypes.DBResponseObject<appTypes.DBMatchResponseConfig>>;
    static loginUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>;
    static createNewUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBAddUserResponseObject<appTypes.DBAddUserResponseConfig>>;
    static deleteUser(userCredentials: appTypes.UserCredentials): Promise<unknown>;
    static updatePassword(userCredentials: appTypes.UserCredentials, newPassword: string): Promise<appTypes.DBUpdatePasswordResponseObject<appTypes.DBUpdatePasswordResponseConfig>>;
    static saveEmailVerification(token: string, email: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>;
    static checkEmailVerification(token: string): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>;
    static deleteEmailVerification(token: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>;
    static updateVerification(email: string): Promise<appTypes.DBUpdateResponseObject<appTypes.DBUpdateResponseConfig>>;
}
export default UsersDatabase;
