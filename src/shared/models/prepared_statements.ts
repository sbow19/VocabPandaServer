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
    }

    
        
   
        
}

export default preparedSQLStatements;