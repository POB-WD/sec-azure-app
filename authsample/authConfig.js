/**
 * Configuration object to be passed to MSAL instance on creation. 
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md 
 */
const msalConfig = {
    auth: {
        // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
        clientId: "1c8b2ab7-b6f1-4755-a668-1fdd174a4a16",
        // Full directory URL, in the form of https://login.microsoftonline.com/<tenant-id>
        authority: "https://login.microsoftonline.com/3ea78af3-094b-492f-9237-8077bc4f31ab",
        // Full redirect URL, in form of http://localhost:3000
        redirectUri: "https://witty-glacier-03a3ce003.4.azurestaticapps.net",
        //redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {	
        loggerOptions: {	
            loggerCallback: (level, message, containsPii) => {	
                if (containsPii) {		
                    return;		
                }		
                switch (level) {		
                    case msal.LogLevel.Error:		
                        console.error(message);		
                        return;		
                    case msal.LogLevel.Info:		
                        console.info(message);		
                        return;		
                    case msal.LogLevel.Verbose:		
                        console.debug(message);		
                        return;		
                    case msal.LogLevel.Warning:		
                        console.warn(message);		
                        return;		
                }	
            }	
        }	
    }
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit: 
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
const loginRequest = {
    scopes: ["User.Read"]
};

const functionRequest = {
    scopes: ["api://3d14b644-fee0-4f1f-af2e-0343c86148c0/secapp"],
    forceRefresh: true
}

const easyauthRequest = {
    scopes: ["api://f579ec0e-a953-485b-8151-aeaf757c6f03/user_impersonation"]
}

const reportRequest = {
    scopes: ["api://eb71dee1-9991-4f98-b80a-fa16db720f9e/user_impersonation"],
    forceRefresh: true
}

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
const tokenRequest = {
    scopes: ["User.Read", "Mail.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};
