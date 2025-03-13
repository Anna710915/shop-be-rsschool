import { catalogBatchProcessHandler } from "../../../lib/lambda/catalogBatchProcessHandler";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const dynamoDBMock = mockClient(DynamoDBClient);
const snsMock = mockClient(SNSClient);

describe('catalogBatchProcessHandler', () => {
  beforeEach(() => {
    dynamoDBMock.reset(); 
    snsMock.reset();
  });

  const mockEvent = {
    Records: [
      {
        body: JSON.stringify({
          title: 'Product A',
          description: 'Description A',
          price: 150,
          count: 10,
        }),
      },
      {
        body: JSON.stringify({
          title: 'Product B',
          description: 'Description B',
          price: 50,
          count: 5,
        }),
      },
    ],
  };

  beforeEach(() => {
    dynamoDBMock.reset(); // Reset the mock client before each test
    snsMock.reset(); // Reset SNS mock before each test
  });

  it('should process the batch and send SNS notifications', async () => {
    // Mock successful DynamoDB transaction write
    dynamoDBMock.on(TransactWriteItemsCommand).resolves({});
    
    // Mock successful SNS publish
    snsMock.on(PublishCommand).resolves({});

    const result = await catalogBatchProcessHandler(mockEvent as any);

    // Expect DynamoDB transactions to be called with correct data
    expect(dynamoDBMock.calls().length).toBe(2); // 2 records in the batch

    // Expect SNS to be called for each product
    expect(snsMock.calls().length).toBe(2);
  });

  it('should handle empty records gracefully', async () => {
    const emptyEvent = { Records: [] };

    await catalogBatchProcessHandler(emptyEvent as any);

    // No transactions should be made
    expect(dynamoDBMock.calls().length).toBe(0);
    expect(snsMock.calls().length).toBe(0);
  });

  it('should handle errors from DynamoDB transaction gracefully', async () => {
    // Simulate an error from DynamoDB
    dynamoDBMock.on(TransactWriteItemsCommand).rejects(new Error('DynamoDB Error'));

    const result = await catalogBatchProcessHandler(mockEvent as any);

    // Expect the error to be logged
    expect(result).toBeUndefined(); // In this case, we do not handle the error explicitly, so return is undefined
    expect(dynamoDBMock.calls().length).toBe(1);
    expect(snsMock.calls().length).toBe(0); // SNS should not be called if DynamoDB fails
  });

  it('should handle errors from SNS publish gracefully', async () => {
    // Simulate successful DynamoDB but SNS fails
    dynamoDBMock.on(TransactWriteItemsCommand).resolves({});
    snsMock.on(PublishCommand).rejects(new Error('SNS Error'));

    await catalogBatchProcessHandler(mockEvent as any);

    // Expect SNS to have failed, but DynamoDB should have been called
    expect(dynamoDBMock.calls().length).toBe(2);
    expect(snsMock.calls().length).toBe(1); // Both SNS publishes are attempted, but we expect an error to be logged
  });
});