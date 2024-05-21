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
        deleteEntry: `DELETE FROM user_entries WHERE entry_id = ?;`
    },
    projectStatements: {
        addNewProject: `INSERT INTO projects VALUES (?, ?, ?, ?);`, //user_id, project, target_lang, output_lang
        deleteProject: `DELETE FROM projects WHERE user_id = ? AND project = ?;`
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
        checkTokenVerification: `
        SELECT * FROM verification 
        WHERE token = ?
        AND token_expiry > ?
        ;`,
        deleteEmailVerificationToken: `DELETE FROM verification WHERE token =?;`, //email
        updateVerificationStatus: `
        UPDATE users 
        SET verified = 1
        WHERE email = ?
        
        ;`,
        checkPremiumStatus: `SELECT *  FROM user_details WHERE user_id = ?;`,
        updatePassword: `UPDATE users SET password_hash = ? WHERE id = ?;`
    },
    generalStatements: {
        userIdMatch: `SELECT * FROM users WHERE id = ? OR username = ?;`,
        usersUsernameMatch: `SELECT * FROM users WHERE username = ?;`,
        usersEmailMatch: `SELECT * FROM users WHERE email = ?;`,
        getPasswordHash: `SELECT password_hash FROM users WHERE id = ?;`
    },
    translationsStatements: {
        checkTranslationsLeft: `SELECT * FROM translation_left WHERE user_id = ?;`,
        updateTranslationsLeft: `UPDATE translation_left SET translations_left = ? WHERE user_id = ?;`,
        setTimer: `UPDATE next_translations_refresh SET translations_refresh = ? WHERE user_id = ?;`,
        getTranslationTimeLeft: `SELECT translations_refresh FROM next_translations_refresh WHERE user_id = ?;`,
    }
};
exports.default = preparedSQLStatements;
//# sourceMappingURL=prepared_statements.js.map