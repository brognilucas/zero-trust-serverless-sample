import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

export class DatabaseService {
  constructor(config = {}) {
    this.client = new DynamoDBClient({ 
      region: process.env.AWS_REGION || 'us-east-1',
      ...config 
    });
  }

  async createUser(email, passwordHash) {
    const params = {
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        email: { S: email },
        passwordHash: { S: passwordHash },
        createdAt: { S: new Date().toISOString() }
      },
      ConditionExpression: 'attribute_not_exists(email)',
    };

    await this.client.send(new PutItemCommand(params));
  }

  async getUser(email) {
    const params = {
      TableName: process.env.USER_TABLE_NAME,
      Key: { email: { S: email } }
    };
    const result = await this.client.send(new GetItemCommand(params));
    return result.Item ? this.unmarshallDynamoItem(result.Item) : null;
  }

  async setMfaCode(email, mfaCode) {
    const ttl = Math.floor(Date.now() / 1000) + parseInt(process.env.MFA_TTL_SECONDS, 10);
    const params = {
      TableName: process.env.MFA_CODE_TABLE_NAME,
      Item: {
        email: { S: email },
        mfaCode: { S: mfaCode },
        ttl: { N: ttl.toString() }
      }
    };
    await this.client.send(new PutItemCommand(params));
  }

  async getMfaCode(email) {
    const params = {
      TableName: process.env.MFA_CODE_TABLE_NAME,
      Key: { email: { S: email } },
    };
    const result = await this.client.send(new GetItemCommand(params));
    return result.Item ? this.unmarshallDynamoItem(result.Item) : null;
  }

  async deleteMfaCode(email) {
    const params = {
      TableName: process.env.MFA_CODE_TABLE_NAME,
      Key: { email: { S: email } },
    };
    await this.client.send(new DeleteItemCommand(params));
  }

  unmarshallDynamoItem(item) {
    if (!item) return null;
    
    const result = {};
    for (const key in item) {
      const valueObj = item[key];
      const dataType = Object.keys(valueObj)[0]; // ex: "S", "N", etc.
      result[key] = valueObj[dataType];
    }
    return result;
  }
}

