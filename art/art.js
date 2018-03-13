import {DynamoDB} from 'aws-sdk';
import {serverError, ok} from '@sophon-lab/lambda-kit';

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
      },
    };
  }

  if (jobData.styleSpec) {
    return {
      getContentImageUrl(jobData) {
        return jobData.styleSpec.contentImageUrl;
      },
      getStyleImageUrl(jobData) {
        return jobData.styleSpec.styleImageUrl;
      },
      getOutputImageUrl(jobData) {
        return jobData.outputUrls[0];
      },
    };
  }

  return {
    getContentImageUrl(jobData) {
      return jobData.imgUrl;
    },
    getStyleImageUrl(jobData) {
      return getPredefinedStyleUrlById(jobData.styles[0].id);
    },
    getOutputImageUrl(jobData) {
      return jobData.outputUrls[0];
    },
  };
}

function extractArtFromArtJobData(jobData) {
  const {getContentImageUrl, getStyleImageUrl, getOutputImageUrl} = getters(
    jobData,
  );

  return {
    contentImageUrl: getContentImageUrl(jobData),
    styleImageUrl: getStyleImageUrl(jobData),
    outputImageUrl: getOutputImageUrl(jobData),
  };
}

function hasPagination(event) {
  return (
    event.queryStringParameters !== null &&
    event.queryStringParameters.offset &&
    event.queryStringParameters.limit
  );
}

function getPagination(event) {
  return {
    offset: event.queryStringParameters.offset,
    limit: event.queryStringParameters.limit,
  };
}

function hasFeaturedFlag(event) {
  return (
    event.queryStringParameters !== null &&
    event.queryStringParameters.featured &&
    event.queryStringParameters.featured === 'true'
  );
}

function isFeaturedArt(item) {
  return item.Featured && item.Featured.BOOL;
}

// eslint-disable-next-line import/prefer-default-export
export const list = (event, context, callback) => {
  const db = new DynamoDB();

  db.scan({TableName: 'ArtJobs'}, (dynamoError, data) => {
    if (dynamoError) {
      console.log(dynamoError);
      serverError(callback, dynamoError);
    } else {
      const featuredOnly = hasFeaturedFlag(event);
      const arts = [];

      for (let i = 0; i < data.Items.length; i++) {
        // Naive implementation
        if (featuredOnly && !isFeaturedArt(data.Items[i])) {
          continue;
        }

        try {
          const jobData = JSON.parse(data.Items[i].JsonData.S);

          if (jobData.status === 'finished') {
            arts.push(extractArtFromArtJobData(jobData));
          }
        } catch (jsonParseError) {
          console.error(jsonParseError);
          console.log(
            'dirty data',
            data.Items[i].jobId,
            data.Items[i].JsonData,
          );
        }
      }

      // Naive implementation for now
      // Need better version need a new dynamoDB schema design
      if (hasPagination(event)) {
        const {offset, limit} = getPagination(event);

        ok(callback, arts.slice(offset, limit));
      } else {
        ok(callback, arts);
      }
    }
  });
};
