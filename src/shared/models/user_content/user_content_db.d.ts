import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UsersContentDatabase extends vpModel {
    static addNewProject: (newProjectDetails: appTypes.ProjectDetails) => Promise<appTypes.APIOperationResponse>;
    static deleteProject: (deleteProjectDetails: appTypes.ProjectDetails) => Promise<appTypes.APIOperationResponse>;
    static addNewEntry: (newEntryObject: appTypes.EntryDetails) => Promise<appTypes.APIOperationResponse>;
    static updateEntry: (updateEntryObject: appTypes.EntryDetails) => Promise<appTypes.APIOperationResponse>;
    static deleteEntry: (entryId: string) => Promise<appTypes.APIOperationResponse>;
    static addTag: (tagName: string, username: string) => Promise<appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig>>;
    static deleteTag: (tagId: string) => Promise<appTypes.DBDeleteResponseObject<appTypes.DBDeleteResponseConfig>>;
}
export default UsersContentDatabase;
