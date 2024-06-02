declare const preparedSQLStatements: {
    entryStatements: {
        addNewEntry: string;
        addEntryTags: string;
        updateEntry: string;
        removeEntryTags: string;
        deleteEntry: string;
        getAllEntries: string;
    };
    projectStatements: {
        addNewProject: string;
        deleteProject: string;
        getAllProjects: string;
    };
    settingsStatements: {
        updateUserSettings: string;
        getUserSettings: string;
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
        getEmailFromToken: string;
        deleteEmailVerificationToken: string;
        updateVerificationStatus: string;
        checkPremiumStatus: string;
        updatePassword: string;
        getVerificationStatus: string;
        updateLastLoggedIn: string;
    };
    generalStatements: {
        userIdMatch: string;
        usersUsernameMatch: string;
        usersEmailMatch: string;
        getPasswordHash: string;
        updatePlays: string;
        updatePlaysRefreshTime: string;
    };
    translationsStatements: {
        checkTranslationsLeft: string;
        updateTranslationsLeft: string;
        setTimer: string;
        getTranslationTimeLeft: string;
    };
    bufferStatements: {
        checkForDeviceMatches: string;
        fetchBufferContent: string;
        pushLocalContent: string;
        clearBufferContent: string;
        addNewUserApp: string;
        addNewUserExtension: string;
        addNewUserHub: string;
    };
    syncStatements: {
        setSyncFlag: string;
        checkUserSyncFlag: string;
        addNewUser: string;
    };
    CRONQueries: {
        updatePlaysRefresh: string;
        checkPlaysRefresh: string;
        updatePlaysLeft: string;
        checkTranslationsRefresh: string;
        updateTranslationsRefresh: string;
        getPremiumStatus: string;
        updateTranslationsPremium: string;
        updateTranslationsFree: string;
        checkPremiumUsers: string;
        deletePremiumUser: string;
        getUnverifiedEmails: string;
        getIdFromEmail: string;
        deleteUserByEmail: string;
        deleteEmailVerification: string;
    };
};
export default preparedSQLStatements;
