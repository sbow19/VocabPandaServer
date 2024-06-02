"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preparedSQLStatements = {
    entryStatements: {
        addNewEntry: `INSERT INTO user_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        addEntryTags: `INSERT INTO entry_tags VALUES (?, ?)`,
        updateEntry: `UPDATE user_entries
        SET 
            target_language_text = ?,
            target_language = ?,
            output_language_text = ?,  
            output_language = ?,
            tags = ?,
            updated_at = ?
        WHERE entry_id = ?
        ;`,
        removeEntryTags: `DELETE FROM entry_tags WHERE entry_id = ?;`,
        deleteEntry: `DELETE FROM user_entries WHERE entry_id = ?;`,
        getAllEntries: `SELECT * from user_entries WHERE user_id = ?;`
    },
    projectStatements: {
        addNewProject: `INSERT INTO projects VALUES (?, ?, ?, ?);`, //user_id, project, target_lang, output_lang
        deleteProject: `DELETE FROM projects WHERE user_id = ? AND project = ?;`,
        getAllProjects: `SELECT * from projects WHERE user_id = ?;`
    },
    settingsStatements: {
        updateUserSettings: `UPDATE user_settings 
        SET 
            timer_on = ?,
            slider_val = ?,
            target_lang = ?,
            output_lang = ?,
            default_project = ?
        WHERE (user_id = ?);`,
        getUserSettings: `SELECT * FROM user_settings WHERE user_id = ?;`
    },
    accountStatements: {
        deleteAccount: `DELETE FROM users 
        WHERE id = ?
        OR username = ?
        ;`,
        addAccount: `INSERT INTO users VALUES (?, ?, ?, ?, DEFAULT, DEFAULT, 0);`, //id, username, email, password_hash, verified
        connectUserDeviceToAccount: `UPDATE api_keys 
        SET user_id = ? 
        WHERE
            api_key = ?
        AND
            device_id = ? 
        ;`,
        addUserDetails: `INSERT INTO user_details VALUES (?, ?, ?, ?);`, //username, id, last_logged_in, premium
        addDefaultSettings: `INSERT INTO user_settings VALUES (?, ?, ?, ?, ?, ?);`, //user_id, timer_on, slider_val, target_lang, output_lang, default_project
        addDefaultNextPlaysRefresh: `INSERT INTO next_plays_refresh VALUES (?, ?);`, //user_id, game_refresh
        addDefaultPlaysLeft: `INSERT INTO plays_left VALUES (?, ?);`, //user_id, plays_left
        addDefaultNextTranslationsRefresh: `INSERT INTO next_translations_refresh VALUES (?, ?);`, //user_id, translations_refresh
        addDefaultTranslationsLeft: `INSERT INTO translation_left VALUES (?, ?);`, //user_id, translation_left
        addEmailVerificationToken: `INSERT INTO verification VALUES (?, ?, ?);`, //email, token, token_expiry
        getEmailFromToken: `
        SELECT email FROM verification 
        WHERE token = ?;`,
        deleteEmailVerificationToken: `DELETE FROM verification WHERE token =?;`, //email
        updateVerificationStatus: `
        UPDATE users 
        SET verified = 1
        WHERE email = ?
        
        ;`,
        checkPremiumStatus: `SELECT premium  FROM user_details WHERE user_id = ?;`,
        updatePassword: `UPDATE users SET password_hash = ? WHERE id = ?;`,
        getVerificationStatus: `SELECT verified FROM users WHERE id = ?;`,
        updateLastLoggedIn: `
        UPDATE user_details
        SET last_logged_in = ?
        WHERE user_id = ?
        ;`
    },
    generalStatements: {
        userIdMatch: `SELECT * FROM users WHERE id = ? OR username = ?;`,
        usersUsernameMatch: `SELECT * FROM users WHERE username = ?;`,
        usersEmailMatch: `SELECT * FROM users WHERE email = ?;`,
        getPasswordHash: `SELECT password_hash FROM users WHERE id = ?;`,
        updatePlays: `
            UPDATE plays_left
            SET plays_left = ?
            WHERE user_id = ?
        ;`,
        updatePlaysRefreshTime: `
        UPDATE next_plays_refresh
        SET games_refresh = ?
        WHERE user_id = ?
    ;`
    },
    translationsStatements: {
        checkTranslationsLeft: `SELECT * FROM translation_left WHERE user_id = ?;`,
        updateTranslationsLeft: `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;`,
        setTimer: `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;`,
        getTranslationTimeLeft: `SELECT translations_refresh FROM next_translations_refresh WHERE user_id = ?;`,
    },
    bufferStatements: {
        checkForDeviceMatches: `SELECT device_types FROM api_keys WHERE user_id = ?;`,
        fetchBufferContent: `SELECT buffer_content FROM ? WHERE user_id =?;`,
        pushLocalContent: `UPDATE ? SET buffer_content = ? WHERE user_id =?;`,
        clearBufferContent: `UPDATE ?  SET buffer_content = ? WHERE user_id =?;`,
        addNewUserApp: `INSERT INTO user_app_buffers VALUES (?, ?, ?);`,
        addNewUserExtension: `INSERT INTO user_extension_buffers VALUES (?, ?, ?);`,
        addNewUserHub: `INSERT INTO user_buffers VALUES (?, ?, ?);`
    },
    syncStatements: {
        setSyncFlag: `UPDATE full_sync 
        SET 
        full_sync_flag = ?,
        sync_id =?
        WHERE 
        user_id = ? AND
        device_id = ?
        ;`,
        checkUserSyncFlag: `SELECT * FROM sync WHERE user_id =? AND device_id = ?;`,
        addNewUser: `INSERT INTO full_sync VALUES (?,?,?,?);`
    },
    CRONQueries: {
        updatePlaysRefresh: `
        UPDATE next_plays_refresh
        SET next game_refresh = NULL
        WHERE user_id = ?;`,
        checkPlaysRefresh: 'SELECT * FROM next_plays_refresh WHERE game_refresh < ?;',
        updatePlaysLeft: `
        UPDATE plays_left
        SET next plays_left = 10
        WHERE user_id = ?
        ;`,
        checkTranslationsRefresh: 'SELECT * FROM next_translations_refresh WHERE translations_refresh < ?;',
        updateTranslationsRefresh: `
        UPDATE next_translations_refresh
        SET translations_refresh = NULL
        WHERE user_id = ?
        ;`,
        getPremiumStatus: `SELECT premium FROM user_details WHERE user_id = ?;`,
        updateTranslationsPremium: `
        UPDATE translation_left
        SET translations_left = 250
        WHERE user_id = ?;`,
        updateTranslationsFree: `
        UPDATE translation_left
        SET translations_left = 120
        WHERE user_id = ?;`,
        checkPremiumUsers: 'SELECT * FROM premium_users WHERE membership_end < ?;',
        deletePremiumUser: `DELETE FROM premium_users WHERE user_id = ?;`,
        getUnverifiedEmails: 'SELECT * FROM verification WHERE token_expiry < ?;',
        getIdFromEmail: `SELECT id FROM users WHERE email = ?;`,
        deleteUserByEmail: ` DELETE FROM users WHERE email = ?;`,
        deleteEmailVerification: `
        DELETE FROM verification
        WHERE email = ?;`
    }
};
exports.default = preparedSQLStatements;
//# sourceMappingURL=prepared_statements.js.map