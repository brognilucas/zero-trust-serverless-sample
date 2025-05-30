import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import FakeDatabase from '../__tests__/fakeDatabase.js';

class DatabaseService {
  constructor(config = {}) {
    this.client = new DynamoDBClient({ 
      region: process.env.AWS_REGION || 'us-east-1',
      ...config 
    });
  }

  async createUser(email, passwordHash) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        email: { S: email },
        passwordHash: { S: passwordHash },
        createdAt: { S: new Date().toISOString() }
      },
      ConditionExpression: 'attribute_not_exists(email)',
    };

    await this.client.send(new PutItemCommand(params));
  }
}



export const databaseFactory = () => {
  if (process.env.NODE_ENV === 'test') {
    return new FakeDatabase();
  }
  return new DatabaseService({
    region: process.env.AWS_REGION || 'us-east-1',
  });
}

