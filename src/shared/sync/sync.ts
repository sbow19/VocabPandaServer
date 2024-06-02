import UsersContentDatabase from '@shared/models/user_content/user_content_db';
import UserBuffersDatabase from '@shared/models/user_buffers/user_buffers_db';
import UserSyncDatabase from '@shared/models/user_sync/user_sync_db';
import * as appTypes from '@appTypes/appTypes'
import * as apiTypes from '@appTypes/api'
import vpModel from '@shared/models/models_template';



class SyncProcess {
    //Syncing local changes
static syncProcess = (syncRequestWrapper: apiTypes.LocalSyncRequestWrapper<apiTypes.APIContentCallDetails>, deviceId: string): Promise<apiTypes.BackendLocalSyncResult>=>{
    return new Promise(async(resolve, reject)=>{

        const localSyncRequestsArray = syncRequestWrapper.requests;

        //Set up standard response data containing necessary info
        const backendLocalSyncResult: apiTypes.BackendLocalSyncResult = {
            //Identification of sync process
            requestId: syncRequestWrapper.requestId, //Current sync operation, added to db with flags
            requestIds: [], //Local sync requests processed
            userId: syncRequestWrapper.userId, 

            //Meta details
            success: false, //false triggers total sync
            message: "operation unsuccessful",
            syncType: "login", //Indicating that backend was processing login sync

            //User account details
            userAccountChanges: false, //Changes such as settings, premium status, deletion
            userAccountDetails: {},

            //Local buffer sync
            partialSyncRequired: false,
            syncContent: [], //content added on extension, essentially

            //Where full sync required
            fullSyncRequired: false,
            databaseContents: {}
        }

        try{
            //Process content queues.

            const parsingResult = await vpModel.parseLocalContent(localSyncRequestsArray);
    
            if(parsingResult.contentArray.length > 0){
    
                await UsersContentDatabase.pushLocalContent(parsingResult.contentArray); 
    
                /* If successful, then we add content to extension buffer, if there is one */
                await UserBuffersDatabase.pushLocalContent(parsingResult.contentArray, syncRequestWrapper.deviceType, syncRequestWrapper.userId);
    
            }else if (parsingResult.contentArray.length === 0){
                //If there is no content to be synced, then we move on
            }
            
    
        }catch(e){
            //Failure to sync, send appropriate trigger to backend
            const SyncError = e as appTypes.BackendOperation;
    
            if(SyncError.operationType === "Parse content queue" && !SyncError.success){
                //Where there was an error parsing the content queues in local sync requests.
                reject(backendLocalSyncResult);
    
            } else if(SyncError.operationType === "Push local content db" && !SyncError.success){
                //Where there was an error pushing local content to db.
                const DBError = e as appTypes.DBOperation;
    
                //Check the error type to see what operation we conduct
                switch(DBError.specificErrorCode){
                    case 'ER_ACCESS_DENIED_ERROR':
                        //If user does not have access to database, then no sync response provided
                        break
                    case 'ER_DUP_UNIQUE':
                        //If user does not have access to database, then send error to frontend
                        try{
                            await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId,  true);
                            const results2 = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                            await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                            backendLocalSyncResult.databaseContents = results2;
                            backendLocalSyncResult.fullSyncRequired = true;
                        }catch(e){
    
    
                        }
                        break
                    case 'ECONNREFUSED':
                        //If user does not have access to database, then no sync response provided
                        break
                    case 'PROTOCOL_CONNECTION_LOST':
                        //If user does not have access to database, then no sync response provided
                        break
                    case "No rows affected":
                        //Where no rows affected, indicates that there was an error
                        try{
                            await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId, true);
                            const results2 = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                            await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                            backendLocalSyncResult.databaseContents = results2;
                            backendLocalSyncResult.fullSyncRequired = true;
                        }catch(e){
    
    
                        }
                        
                        break
                    case "Unknown error":
                        //If user does not have access to database, then no sync response provided
                        break
                    default:
                        //Where there is another error type not known or handled
                        break;
                    
                }
    
            } else if(SyncError.operationType === "Push local content buffer" && !SyncError.success){
                //Where there was an error pushing local content to buffer
                try{
                    await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId, true);
                    const results2 = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                    await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                    backendLocalSyncResult.databaseContents = results2;
                    backendLocalSyncResult.fullSyncRequired = true;
                }catch(e){
                    
                }
    
    
            }
    
            reject(backendLocalSyncResult);
            return//End execution
    
        }
    
        //Sync successful...
        //Check each local sync request for a total sync flag and check all response queues for failed sync flag
            /*If any found, then total sync flag triggered*/
        
        try{
    
            for(let localSyncRequest of localSyncRequestsArray){
                //Check for any total sync flags
                if(localSyncRequest.syncType === "total sync"){
    
                    throw "full sync"
    
                }else {
    
                    const localSyncResponseQueue: Array<apiTypes.LocalBackendSyncResult | null> = localSyncRequest.requestDetails.responseQueue;
    
                    //Else check for any failed syncs in response queue
                    for(let localSyncResponse of localSyncResponseQueue){
                        if(!localSyncResponse?.userContentSync?.valid){
                            //If there was some failure to sync locally, then we trigger sync flag
                            throw "sync"
                        } else if (localSyncResponse.userContentSync.valid){
                            //Continue
                        }
                    }
    
                }
            }
    
        }catch(e){
    
            //If user does not have access to database, then send error to frontend
            try{
                await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId, true);
                const results = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                backendLocalSyncResult.databaseContents = results;
                backendLocalSyncResult.fullSyncRequired = true;
            }catch(e){
                //Some error
    
            }
    
            reject(backendLocalSyncResult);
            return //End execution
    
        }
    
        //Check all response queue ids and acknowledgement ids and match against current db
            /* Check against ids in db. If none match total sync or local sync flag, then trigger full sync */
    
        try{
    
            for(let localSyncRequest of localSyncRequestsArray){
    
                const responseQueue:Array<apiTypes.LocalBackendSyncResult | null> = localSyncRequest.requestDetails.responseQueue;
                const syncIds: string[] = []
                const acknowledgements: Array<apiTypes.FEAcknowledgement | null> = localSyncRequest.requestDetails.acknowledgements;
    
                for(let response of responseQueue){
    
                    syncIds.push(response.requestId);
    
                }
    
                for(let acknowledgement of acknowledgements){
    
                    syncIds.push(acknowledgement.requestId);
    
                }

                backendLocalSyncResult.requestIds = syncIds;
         
                const result = await UserSyncDatabase.checkSyncFlags(syncRequestWrapper.userId, syncIds, syncRequestWrapper.deviceId);

                
    
            }
    
        }catch(e){
    
            //If user does not have access to database, then send error to frontend
            try{
                await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId, true);
                const results = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                backendLocalSyncResult.databaseContents = results;
                backendLocalSyncResult.fullSyncRequired = true;
            }catch(e){
                //Some error getting all content or setting sync flag
    
            }
    
            reject(backendLocalSyncResult);
            return
            
        }
    
        //Send backend sync result and buffer content. Wait for response in /syncresult
        try{
            //Fetch syncing update object from the backend
    
            const {resultArray} = await UserBuffersDatabase.fetchBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
    
            if(resultArray.length === 0){
                //If there isn't content in the buffer
    
                backendLocalSyncResult.success = true;
                resolve(backendLocalSyncResult);
    
            }else if(resultArray.length > 0){
                //If there is content in the buffer
    
                backendLocalSyncResult.partialSyncRequired = true;
                backendLocalSyncResult.syncContent = resultArray;
                await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                resolve(backendLocalSyncResult);
            }
    
             
    
        }catch(e){
            //If there is some error fetching the buffer content. Then we trigger full sync response
            try{
                await UserSyncDatabase.setSyncFlag(syncRequestWrapper.userId, syncRequestWrapper.requestId, deviceId, true);
                const results = await UsersContentDatabase.getAllContent(syncRequestWrapper.userId);
                await UserBuffersDatabase.clearBufferContent(syncRequestWrapper.deviceType, syncRequestWrapper.userId);
                backendLocalSyncResult.databaseContents = results;
                backendLocalSyncResult.fullSyncRequired = true;
            }catch(e){
                //Some error getting all content or setting sync flag
    
            }
            reject(backendLocalSyncResult);
    
        }
    

    }) 
};

//Get full sync content
static prepareFullSyncContent = (userId:string, requestId: string, deviceId: string, deviceType: string): Promise<appTypes.DBOperation<apiTypes.BackendContent>>=>{
    return new Promise(async(resolve, reject)=>{

        const backOperationResult: appTypes.DBOperation<apiTypes.BackendContent> = {
            success: false,
            operationType: "Prepare Full Sync Content",
            resultArray: []
        }


        try{
            await UserSyncDatabase.setSyncFlag(userId, requestId, deviceId,  true);
            const results = await UsersContentDatabase.getAllContent(userId);
            await UserBuffersDatabase.clearBufferContent(deviceType, userId);

            backOperationResult.success = true;
            backOperationResult.resultArray = results.resultArray;

            resolve(results)
            
        }catch(e){

            reject(backOperationResult);

        }
                   

    }) 
};

}


export default SyncProcess;