import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UsersContentDatabase extends vpModel {
    static addNewProject(newProjectDetails: appTypes.NewProjectDetails, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>;
    static deleteProject(projectName: string, username: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>;
    static addNewEntry(newEntryObject: appTypes.NewEntryDetails, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>;
    static updateEntry(updateObject: appTypes.NewEntryDetails, entryId: string): Promise<appTypes.DBUpgradeResponseObject<appTypes.DBUpdateResponseConfig>>;
    static deleteEntry(entryId: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>;
    static addTag(tagName: string, username: string): Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>;
    static deleteTag(tagId: string): Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>;
}
export default UsersContentDatabase;
