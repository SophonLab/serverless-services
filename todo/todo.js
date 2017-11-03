// eslint-disable-next-line import/prefer-default-export
const aws = require('aws-sdk');
const db = new aws.DynamoDB();

module.exports.list = (event, context, callback) => {
  if (event.requestContext && event.requestContext.authorizer) {
    const userId = event.requestContext.authorizer.sub;

    db.scan({
      TableName: "Todos",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": {
          S: userId
        }
      }
    }, function(err, data) {
      if (err) {
        callback(null, {
          statusCode: 422,
          body: JSON.stringify({ message: err.message })
        });
      } else {
        const todos = [];

        for(var i = 0; i < data.Items.length; i++){
          todos.push({
            'uuid': data.Items[i].uuid.S,
            'name': data.Items[i].name.S
          });
        }
        callback(null, {
          statusCode : 200,
          body: JSON.stringify({ todos })
        });
      }
    });
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized Request' })
    });
  }
};

module.exports.create = (event, context, callback) => {
  if (event.requestContext && event.requestContext.authorizer) {
    const userId = event.requestContext.authorizer.sub;

    try {
      const data = JSON.parse(event.body);
      const uuid = data['uuid'];

      if (!uuid) {
        return callback(null, {
          statusCode: 422,
          body: JSON.stringify({ message: 'missing uuid.' })
        });
      }

      var name = data['name'];

      if (!name) {
        return callback(null, {
          statusCode: 422,
          body: JSON.stringify({ message: 'missing name.' })
        });
      }

      const todoModel = {
        uuid: {"S": uuid},
        name: {"S": name},
        userId: {"S": userId}
      };

      db.putItem({
        TableName: 'Todos',
        Item: todoModel,
        Expected: {
          uuid: { Exists: false }
        }
      }, function (err, data) {
        if (err) {
          // If we get an err, we'll assume it's a duplicate email and send an
          // appropriate message
          return callback(null, {
            statusCode: 422,
            body: JSON.stringify({ message: err.message })
          });
        }
        // If the data was stored succesfully, we'll respond accordingly
        callback(null, { statusCode : 200 });
      });
    } catch (e) {
      return callback(null, {
        statusCode: 422,
        body: JSON.stringify({ message: e.message })
      });
    }
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized Request' })
    });
  }
};

module.exports.destroy = (event, context, callback) => {
  if (event.requestContext && event.requestContext.authorizer) {
    const userId = event.requestContext.authorizer.sub;

    var uuid = event.pathParameters.id;

    if (!uuid) {
      return callback(null, {
        statusCode: 422,
        body: JSON.stringify({ message: 'missing uuid.' })
      });
    }

    db.deleteItem({
      TableName: 'Todos',
      Key: {
        uuid: { "S": uuid },
        userId: { "S": userId }
      }
    }, function (err, data) {
      if (err) {
        // If we get an err, we'll assume it's a duplicate email and send an
        // appropriate message
        return callback(null, {
          statusCode: 422,
          body: JSON.stringify({ message: err.message })
        });
      }
      // If the data was stored succesfully, we'll respond accordingly
      callback(null, { statusCode : 200 });
    });
  } else {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized Request' })
    });
  }
};
