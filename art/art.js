// eslint-disable-next-line import/prefer-default-export
const aws = require('aws-sdk');
const db = new aws.DynamoDB();
const kit = require('@sophon-lab/lambda-kit');

const { withIdentity, serverError, ok } = kit;

function getPredefinedStyleUrlById(id) {
  return `https://s3-us-west-2.amazonaws.com/images-sophon/style/${id}.jpg`;
}

function getters(jobData) {
  if (jobData.WctFastStyleSpec) {
    return {
      getContentImageUrl(jobData) {
        return jobData.WctFastStyleSpec.contentImageUrl;
      },
      getStyleImageUrl(jobData) {
        return jobData.WctFastStyleSpec.styleImageUrl;
      },
      getOutputImageUrl(jobData) {
        return jobData.outputUrls[0];
      }
    }
  } else {
    return {
      getContentImageUrl(jobData) {
        return jobData.imgUrl;
      },
      getStyleImageUrl(jobData) {
        return getPredefinedStyleUrlById(jobData.styles[0].id);
      },
      getOutputImageUrl(jobData) {
        return jobData.outputUrls[0];
      }
    }
  }
}

module.exports.list = withIdentity((event, context, callback) => {
  db.scan({ TableName: "ArtJobs" }, function(err, data) {
    if (err) {
      serverError(callback, err);
    } else {
      const arts = [];

      for (var i = 0; i < data.Items.length; i++) {
        try {
          const jsonData = data.Items[i].JsonData.S;
          const jobData = JSON.parse(jsonData);

          if (jobData.status === 'finished') {
            const { getContentImageUrl, getStyleImageUrl, getOutputImageUrl } = getters(jobData);

            arts.push({
              contentImageUrl: getContentImageUrl(jobData),
              styleImageUrl: getStyleImageUrl(jobData),
              outputImageUrl: getOutputImageUrl(jobData)
            });
          }
        } catch (e) {
          console.log('dirty data', data.Items[i].jobId, data.Items[i].JsonData.S);
        }
      }

      ok(callback, arts);
    }
  });
});
