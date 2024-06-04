import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from "@appTypes/api";
import vpModel from "@shared/models/models_template";
import { BasicAuthResult } from "basic-auth";
declare class UsersDatabase extends vpModel {
    static createNewUser(userCredentials: apiTypes.APICreateAccount, deviceCredentials: BasicAuthResult): Promise<appTypes.DBOperation<string>>;
    static deleteUser(userCredentials: apiTypes.APIDeleteAccount): Promise<appTypes.DBOperation>;
    static updatePassword(accountObject: apiTypes.APIUpdatePassword): Promise<appTypes.DBOperation>;
    static isCorrectPassword(loginResult: apiTypes.LoginResult): Promise<appTypes.DBOperation>;
    static areCredentialsCorrect(credentials: BasicAuthResult): Promise<appTypes.DBOperation>;
    static saveEmailVerification(token: string, email: string): Promise<appTypes.DBOperation>;
    static getEmailFromToken: (token: string) => Promise<appTypes.DBOperation<string>>;
    static deleteEmailVerification: (token: string) => Promise<appTypes.DBOperation>;
    static updateVerification: (email: string) => Promise<appTypes.DBOperation>;
    static getVerificationStatus: (userId: string) => Promise<appTypes.DBOperation<boolean>>;
    static getAccountDetails: (userId: string) => Promise<appTypes.DBOperation<apiTypes.AccountDetails>>;
}
export default UsersDatabase;
