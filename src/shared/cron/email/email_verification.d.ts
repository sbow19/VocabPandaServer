import * as appTypes from "@appTypes/appTypes";
declare class EmailVerificationChecker {
    static CheckUnverifiedEmails: () => Promise<appTypes.DBOperation>;
}
export default EmailVerificationChecker;
