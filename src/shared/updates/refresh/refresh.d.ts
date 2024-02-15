import * as appTypes from "@appTypes/appTypes";
declare class RefreshCounter {
    constructor();
    static gameRefreshChecker(): Promise<appTypes.refreshErrorResponse>;
    static translationsRefreshChecker(): Promise<appTypes.refreshErrorResponse>;
    static premiumUserChecker(): Promise<appTypes.refreshErrorResponse>;
}
export default RefreshCounter;
