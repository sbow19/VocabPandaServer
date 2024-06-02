"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const crypto = require("crypto");
const nodemailer = require("nodemailer");
class VocabPandaEmail {
    static sendVerificationEmail = (email) => {
        const sendEmailResponse = {
            success: false,
            operationType: "Send Verification Email"
        };
        return new Promise(async (resolve, reject) => {
            const token = crypto.randomBytes(32).toString('hex');
            try {
                //save token in database if email successfully sent, otherwise we skip.
                await users_db_1.default.saveEmailVerification(token, email);
            }
            catch (e) {
                console.log(e, "Error with saving email verification");
                reject(sendEmailResponse);
                return;
            }
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    port: 465,
                    secure: true,
                    auth: {
                        user: "zctlsab@gmail.com",
                        pass: "vuix pcmm wqjx ghdj"
                    },
                    connectionTimeout: 10000, // 10 seconds
                    socketTimeout: 15000, // 10 seconds
                    greetingTimeout: 5000, // 10 seconds
                });
                const result = await transporter.sendMail({
                    from: "Gmail <zctlsab@gmail.com>",
                    to: email,
                    subject: "Testing nodemail",
                    text: `Click on this link to verify your email: http://192.168.1.254:3000/account/createaccount/verify?token=${token}`, //Replace with IP of VPS 
                });
                console.log("Message sent: " + result.messageId);
            }
            catch (e) {
                console.log(e, "Error with nodemail connection");
                reject(sendEmailResponse);
                return;
            }
            sendEmailResponse.success = true;
            resolve(sendEmailResponse);
        });
    };
    static verifyEmailToken = (token) => {
        return new Promise(async (resolve, reject) => {
            const checkEmailTokenResponse = {
                success: false,
                operationType: "Check Verification Token",
                resultArray: null,
                specificErrorCode: ""
            };
            let email;
            try {
                //Get user ID by verification toke
                const getIDResult = await users_db_1.default.getEmailFromToken(token);
                email = getIDResult.resultArray;
            }
            catch (e) {
                if (e.specificErrorCode === "No rows affected") {
                    checkEmailTokenResponse.specificErrorCode = e.specificErrorCode;
                }
                else {
                    checkEmailTokenResponse.specificErrorCode = e.specificErrorCode;
                }
                reject(e);
                return;
            }
            try {
                //Attempt to delete email token
                await users_db_1.default.deleteEmailVerification(token);
            }
            catch (e) {
                checkEmailTokenResponse.specificErrorCode = e.specificErrorCode;
                reject(checkEmailTokenResponse);
                return;
            }
            try {
                //Change user verification status
                await users_db_1.default.updateVerification(email);
            }
            catch (e) {
                checkEmailTokenResponse.specificErrorCode = e.specificErrorCode;
                reject(checkEmailTokenResponse);
                return;
            }
        });
    };
}
exports.default = VocabPandaEmail;
//# sourceMappingURL=email.js.map