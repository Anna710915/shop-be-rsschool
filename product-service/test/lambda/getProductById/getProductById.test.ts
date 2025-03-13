import { getProductByIdHandler } from '../../../lib/lambda/getProductById';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('getProductByIdHandler', () => {
  const mockEvent = {
    pathParameters: {
      productId: '12345',
    },
  };

  beforeEach(() => {
    ddbMock.reset(); 
  });

  it('should return 200 and joined product and stock data when product and stock are found', async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: { id: '12345', title: 'Product A', description: 'Description A', price: 100 },
    }).resolvesOnce({
      Item: { product_id: '12345', count: 50 },
    });

    const result = await getProductByIdHandler(mockEvent as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).count).toBe(50);
    expect(JSON.parse(result.body).title).toBe('Product A');
  });

  it('should return 404 if product or stock is not found', async () => {
    ddbMock.on(GetCommand).resolvesOnce({}).resolvesOnce({
      Item: { product_id: '12345', count: 50 },
    });

    const result = await getProductByIdHandler(mockEvent as any);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('Product not found');
  });

  it('should return 404 if stock is not found', async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: { id: '12345', title: 'Product A', description: 'Description A', price: 100 },
    }).resolvesOnce({});

    const result = await getProductByIdHandler(mockEvent as any);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('Product not found');
  });

  it('should return 500 if an error occurs during data fetching', async () => {
    ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

    const result = await getProductByIdHandler(mockEvent as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});