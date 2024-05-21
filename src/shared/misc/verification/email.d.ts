import * as appTypes from "@appTypes/appTypes";
declare class VocabPandaEmail {
    static sendVerificationEmail: (email: string) => Promise<unknown>;
    static checkToken: (token: string) => Promise<appTypes.APIAccountOperationResponse>;
}
export default VocabPandaEmail;
