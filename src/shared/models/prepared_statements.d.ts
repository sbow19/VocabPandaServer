declare const preparedSQLStatements: {
    entryStatements: {
        addNewEntry: string;
        addEntryTags: string;
        updateEntry: string;
        removeEntryTags: string;
        deleteEntry: string;
    };
    projectStatements: {
        addNewProject: string;
        deleteProject: string;
    };
    settingsStatements: {
        updateUserSettings: string;
    };
    accountStatements: {
        deleteAccount: string;
        addAccount: string;
        connectUserDeviceToAccount: string;
        addUserDetails: string;
        addDefaultSettings: string;
        addDefaultNextPlaysRefresh: string;
        addDefaultPlaysLeft: string;
        addDefaultNextTranslationsRefresh: string;
        addDefaultTranslationsLeft: string;
        addEmailVerificationToken: string;
        checkTokenVerification: string;
        deleteEmailVerificationToken: string;
        updateVerificationStatus: string;
        checkPremiumStatus: string;
        updatePassword: string;
    };
    generalStatements: {
        userIdMatch: string;
        usersUsernameMatch: string;
        usersEmailMatch: string;
        getPasswordHash: string;
    };
    translationsStatements: {
        checkTranslationsLeft: string;
        updateTranslationsLeft: string;
        setTimer: string;
        getTranslationTimeLeft: string;
    };
};
export default preparedSQLStatements;
