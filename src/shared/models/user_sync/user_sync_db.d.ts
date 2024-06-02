import * as appTypes from "@appTypes/appTypes";
import vpModel from "@shared/models/models_template";
declare class UserSyncDatabase extends vpModel {
    static setSyncFlag: (userId: string, syncId: string, deviceId: string, setValue: boolean) => Promise<appTypes.DBOperation>;
    static checkSyncFlags: (userId: string, syncIds: Array<string | null>, deviceId: string) => Promise<appTypes.DBFlagCheck>;
}
export default UserSyncDatabase;
