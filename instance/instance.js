import {EC2} from 'aws-sdk';
import {serverError, ok} from '@sophon-lab/lambda-kit';

export const list = (event, context, callback) => {
  const ec2 = new EC2();

  ec2.describeInstances({}, (err, data) => {
    if (err) {
      console.log(err, err.stack);

      serverError(callback, err);
    } else {
      console.log(data);

      ok(callback, data);
    }
  });
};

export const create = (event, context, callback) => {
  const ec2 = new EC2();
  const data = JSON.parse(event.body);
  const imageId = data['imageId'];

  ec2.runInstances(
    {
      MaxCount: 1,
      MinCount: 1,
      ImageId: imageId,
      InstanceInitiatedShutdownBehavior: 'terminate',
      InstanceType: 'r3.large',
      Monitoring: {
        Enabled: true,
      },
    },
    function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred

        serverError(callback, err);
      } else {
        console.log(data); // successful response

        ok(callback, data);
      }
    },
  );
};

export const destroy = (event, context, callback) => {
  const ec2 = new EC2();
  const instanceId = event.pathParameters.id;

  ec2.terminateInstances(
    {
      InstanceIds: [instanceId],
    },
    (err, data) => {
      if (err) {
        console.log(err, err.stack); // an error occurred

        serverError(callback, err);
      } else {
        console.log(data); // successful response

        ok(callback, data);
      }
    },
  );
};
