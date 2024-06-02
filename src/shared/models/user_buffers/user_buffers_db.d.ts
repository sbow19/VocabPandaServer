import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from '@appTypes/api';
import vpModel from "@shared/models/models_template";
declare class UserBuffersDatabase extends vpModel {
    static getNoOfUserDeviceTypes: (userId: string) => Promise<appTypes.BufferOperationResponse<string>>;
    static fetchBufferContent: (deviceType: string, userId: string) => Promise<appTypes.DBOperation<apiTypes.OperationWrapper[]>>;
    static clearBufferContent: (deviceType: string, userId: string) => Promise<appTypes.DBOperation<apiTypes.OperationWrapper[]>>;
    static pushLocalContent: (userContentArray: apiTypes.OperationWrapper[], deviceType: string, userId: string) => Promise<appTypes.PushLocalContentResult>;
}
export default UserBuffersDatabase;
