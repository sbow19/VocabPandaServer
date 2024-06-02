import * as appTypes from "@appTypes/appTypes";
declare class VocabPandaEmail {
    static sendVerificationEmail: (email: string) => Promise<appTypes.BackendOperation>;
    static verifyEmailToken: (token: string) => Promise<appTypes.DBOperation>;
}
export default VocabPandaEmail;
