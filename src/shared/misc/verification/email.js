"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const crypto = require("crypto");
const nodemailer = require("nodemailer");
class VocabPandaEmail {
    static sendVerificationEmail(email) {
        return new Promise(async (resolve, reject) => {
            const token = crypto.randomBytes(32).toString('hex');
            try {
                //save token in database
                let dbSaveResult = await users_db_1.default.saveEmailVerification(token, email);
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    port: 465,
                    secure: true,
                    auth: {
                        user: "zctlsab@gmail.com",
                        pass: "vuix pcmm wqjx ghdj"
                    }
                });
                const info = await transporter.sendMail({
                    from: "Gmail <zctlsab@gmail.com>",
                    to: "zctlsab@gmail.com",
                    subject: "Testing nodemail",
                    text: `Click on this link to verify your email: http://127.0.0.1:3000/account/createaccount/verify?token=${token}`, //Replace with IP of VPS 
                });
                resolve(console.log("Message sent: " + info.messageId));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static checkToken(token) {
        return new Promise(async (resolve, reject) => {
            try {
                let { dbMatchResponseObject, queryResult } = await users_db_1.default.checkEmailVerification(token);
                if (dbMatchResponseObject.responseMessage === "Match found") {
                    await users_db_1.default.deleteEmailVerification(token);
                    await users_db_1.default.updateVerification(queryResult[0].email);
                    resolve(console.log("User verified"));
                }
            }
            catch (e) {
                reject("User could not be verified");
            }
        });
    }
}
exports.default = VocabPandaEmail;
//# sourceMappingURL=email.js.map