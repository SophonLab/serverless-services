# Auth

Auth service uses Auth0 user pool and provide an auth function which can act as an authorizer for other lambda functions.

## Getting Started

- Install serverless cli `npm install -g serverless`
- `sls deploy`

## Settings that need to be filled

Due to current limitation of cloudformation, many settings still require manual operations from AWS Management Console.

- "Verification" for email delivery configuration
- "App client settings" including identity pool and callback/signout urls
  - for "Enabled Identity Providers" enable "Cognito User Pool"
  - for "Allowed OAuth Flows" enable "implicit grant"
  - for "Allowed OAuth Scopes" enable "email, openid, aws.cognito.signin.user.admin"
  - set callback url, should point to where our SPA is hosted
  - set signout url, should point to where our SPA is hosted
- "Domain name" which should follow the convention "sophon-${stage}"
- "UI customization"
  - upload logo
- "Identity Providers"
  - Google
    - for "Google app ID" and "App Secret" should create one Oauth client and copy client id/secret
    - for "Authorize Scope" enable "profile email openid"
    - Google Oauth client should allow those origins
      - https://sophon-dev.auth.us-east-1.amazoncognito.com
      - https://sophon-stg.auth.us-east-1.amazoncognito.com
      - https://sophon.auth.us-east-1.amazoncognito.com
    - Google Oauth client should allow those redirect URIs
      - https://sophon-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
      - https://sophon-stg.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
      - https://sophon.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
- "Attribute mapping"
  - Google
    - name/email/email_verified
    - sub to username

## The Cognito UI for user sign in

Can be visited through:

https://sophon-${stage}.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=${client_id}&redirect_uri=${callback_url}&state=${app_state_you_want_to_persist}

Later cognito will redirect user to the following callback url if user logged in successfully:

${callback_url}#id_token=${id_token}&access_token=${access_token}&expires_in=${expire}&token_type=Bearer&state=${app_state_you_want_to_persist}


## Some Good Reads

- https://auth0.com/docs/api-auth/grant/authorization-code
- https://auth0.com/docs/api-auth/grant/implicit
