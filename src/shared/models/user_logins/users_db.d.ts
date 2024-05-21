import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UsersDatabase extends vpModel {
    #private;
    static checkCredentials(userCredentials: {
        name: string;
        pass: string;
    }): Promise<appTypes.DBResponseObject<appTypes.DBMatchResponseConfig>>;
    static loginUser(userCredentials: appTypes.UserCredentials): Promise<appTypes.DBMatchResponseObject<appTypes.DBMatchResponseConfig>>;
    static createNewUser(userCredentials: appTypes.APICreateAccount, deviceCredentials: any): Promise<appTypes.APIAccountOperationResponse>;
    static deleteUser(userCredentials: appTypes.APIDeleteAccount): Promise<appTypes.APIAccountOperationResponse>;
    static updatePassword(accountObject: appTypes.APIUpdatePassword): Promise<appTypes.APIAccountOperationResponse>;
    static saveEmailVerification(token: string, email: string): Promise<appTypes.APIAccountOperationResponse>;
    static checkEmailVerification: (token: string) => Promise<appTypes.dbMatchResponse>;
    static deleteEmailVerification: (token: string) => Promise<appTypes.APIAccountOperationResponse>;
    static updateVerification: (email: string) => Promise<appTypes.APIAccountOperationResponse>;
}
export default UsersDatabase;
