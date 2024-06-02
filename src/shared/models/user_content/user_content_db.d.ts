import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from '@appTypes/api';
import vpModel from "@shared/models/models_template";
declare class UsersContentDatabase extends vpModel {
    static pushLocalContent: (userContentArray: apiTypes.OperationWrapper[]) => Promise<appTypes.PushLocalContentResult>;
    static getAllContent: (userId: string) => Promise<appTypes.DBOperation<apiTypes.BackendContent>>;
    static addNewProject: (newProjectDetails: apiTypes.ProjectDetails) => Promise<appTypes.DBOperation>;
    static deleteProject: (deleteProjectDetails: apiTypes.ProjectDetails) => Promise<appTypes.DBOperation>;
    static addNewEntry: (newEntryObject: apiTypes.EntryDetails) => Promise<appTypes.DBOperation>;
    static updateEntry: (updateEntryObject: apiTypes.EntryDetails) => Promise<appTypes.DBOperation>;
    static deleteEntry: (entryObject: apiTypes.EntryDetails) => Promise<appTypes.DBOperation>;
}
export default UsersContentDatabase;
