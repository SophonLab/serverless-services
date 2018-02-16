// Basically send following HTTP request
//
// GET https://sophon.auth0.com/userinfo
// Authorization: 'Bearer {ACCESS_TOKEN}'
//
// Which Returns:
//
// {
//   "email_verified": false,
//   "email": "test.account@userinfo.com",
//   "clientID": "q2hnj2iu...",
//   "updated_at": "2016-12-05T15:15:40.545Z",
//   "name": "test.account@userinfo.com",
//   "picture": "https://s.gravatar.com/avatar/dummy.png",
//   "user_id": "auth0|58454...",
//   "nickname": "test.account",
//   "created_at": "2016-12-05T11:16:59.640Z",
//   "sub": "auth0|58454..."
// }
//

const request = require('request');

const SOPHON_AUTH_ENDPOINT = 'https://sophon.auth0.com';

// extract only user data that is necessary for services
function getUserContext(data) {
  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture
  };
}

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
// can be referenced using cf variable "${cf:auth-${stage}:AuthLambdaFunctionQualifiedArn}"
//
// Authorizer funciton will also attach user context to the request
module.exports.authorize = (event, context, cb) => {
  if (event.authorizationToken) {
    // Remove 'bearer ' from token:
    const token = event.authorizationToken.substring(7);

    console.log('Authorizing with Token: ' + token);

    request.get(
      SOPHON_AUTH_ENDPOINT + '/userinfo',
      { json: true, auth: { 'bearer': token } },
      function(err, response) {
        if (err) {
          console.log('Auth0 Error:', err);

          cb('Unauthorized');
        } else if (response.statusCode === 429) {
          console.log(
            'Auth0 Status Abnormal Code: ', response.statusCode,
            'Body :', response.body
          );

          cb('Too Many Requests');
        } else if (response.statusCode !== 200) {
          console.log(
            'Auth0 Status Abnormal Code: ', response.statusCode,
            'Body :', response.body
          );

          cb('Identity Provider Side Errors');
        } else {
          const userContext = getUserContext(response.body);

          console.log(userContext);

          cb(null, {
            principalId: userContext.sub,
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'execute-api:Invoke',
                  Resource: event.methodArn
                }
              ]
            },
            context: userContext
          });
        }
      }
    );
  } else {
    console.log('No authorizationToken found in the header.');

    cb('Unauthorized');
  }
};
