import dynamoDBClient from '../utils/dynamodb';
const ApiGatewayManagementApi =  require('aws-sdk/clients/apigatewaymanagementapi');

const localConfig = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'DEFAULT_ACCESS_KEY',
  secretAccessKey: 'DEFAULT_SECRET',
};

const remoteConfig = {
  region: process.env.AWS_REGION,
};

const config = process.env.IS_OFFLINE ? localConfig : remoteConfig;
class Client {
  connectionId

  constructor(connectionId) {
    this.connectionId = connectionId;
  }

  async get() {
    const { Item } = await dynamoDBClient
      .get({
        TableName: process.env.TOPICS_TABLE,
        Key: {
          connectionId: this.connectionId,
          topic: 'INITIAL_CONNECTION',
        },
      })
      .promise();
    return Item;
  }

  async getTopics() {
    const { Items: topics } = await dynamoDBClient
      .query({
        ExpressionAttributeValues: {
          ':connectionId': this.connectionId,
        },
        IndexName: 'reverse',
        KeyConditionExpression: 'connectionId = :connectionId',
        ProjectionExpression: 'topic, connectionId',
        TableName: process.env.TOPICS_TABLE,
      })
      .promise();
    return topics;
  }

  async removeTopics(RequestItems) {
    await dynamoDBClient
      .batchWrite({
        RequestItems,
      })
      .promise();
  }

  async unsubscribe() {
    const topics = await this.getTopics();
    if (!topics) {
      throw Error(`Topics got undefined`);
    }
    return this.removeTopics({
      [process.env.TOPICS_TABLE]: topics.map(({ topic, connectionId }) => ({
        DeleteRequest: { Key: { topic, connectionId } },
      })),
    });
  }

  async sendMessage(message) {
    const endpoint =  process.env.IS_OFFLINE ? 'http://localhost:3001' : process.env.PUBLISH_ENDPOINT;
    console.log('publish endpoint', endpoint);
    const gatewayClient = new ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      credentials: config,
      endpoint,
    });

    return gatewayClient
      .postToConnection({
        ConnectionId: this.connectionId,
        Data: JSON.stringify(message),
      })
      .promise();
  }

  async subscribe({ topic, subscriptionId, ttl }) {
    return dynamoDBClient
      .put({
        Item: {
          topic,
          connectionId: this.connectionId,
          subscriptionId,
          ttl: typeof ttl === 'number' ? ttl : Math.floor(Date.now() / 1000) + 60 * 60 * 2,
        },
        TableName: process.env.TOPICS_TABLE,
      })
      .promise();
  }

  async connect() {
    return this.subscribe({
      topic: 'INITIAL_CONNECTION',
    });
  }
}

export default Client;
