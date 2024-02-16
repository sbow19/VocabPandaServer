declare class VocabPandaEmail {
    static sendVerificationEmail(email: string): Promise<unknown>;
    static checkToken(token: string): Promise<unknown>;
}
export default VocabPandaEmail;
