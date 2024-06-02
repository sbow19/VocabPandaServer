import * as appTypes from '@appTypes/appTypes';
import * as apiTypes from '@appTypes/api';
declare class SyncProcess {
    static syncProcess: (syncRequestWrapper: apiTypes.LocalSyncRequestWrapper<apiTypes.APIContentCallDetails>, deviceId: string) => Promise<apiTypes.BackendLocalSyncResult>;
    static prepareFullSyncContent: (userId: string, requestId: string, deviceId: string, deviceType: string) => Promise<appTypes.DBOperation<apiTypes.BackendContent>>;
}
export default SyncProcess;
