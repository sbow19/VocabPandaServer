import * as appTypes from "@appTypes/appTypes";
declare class RefreshCounter {
    static playsRefreshChecker(): Promise<appTypes.DBOperation>;
    static translationsRefreshChecker(): Promise<appTypes.DBOperation>;
    static premiumUserChecker(): Promise<appTypes.DBOperation>;
}
export default RefreshCounter;
