const aws = require('aws-sdk');

const cognito = new aws.CognitoIdentityServiceProvider();

function getUserAttributes(cognitoResponse) {
  return cognitoResponse.UserAttributes.reduce(
    (memo, attr) => {
      memo[attr.Name] = attr.Value;
      return memo;
    },
    { username: cognitoResponse.Username }
  );
}

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
// can be referenced using cf variable "${cf:auth-${stage}:AuthLambdaFunctionQualifiedArn}"
//
// Authorizer funciton will also attach user context to the request
module.exports.authorize = (event, context, cb) => {
  if (event.authorizationToken) {
    // Remove 'bearer ' from token:
    const token = event.authorizationToken.substring(7);

    cognito.getUser({ AccessToken: token }, function(err, data) {
      if (err) {
        console.log('GetUser error:', err);

        cb('Unauthorized');
      } else {
        const attributes = getUserAttributes(data);

        console.log(attributes);

        cb(null, {
          principalId: attributes.sub,
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
          context: attributes
        });
      }
    });
  } else {
    console.log('No authorizationToken found in the header.');

    cb('Unauthorized');
  }
};
