import { getProductListHandler } from '../../../lib/lambda/getProductList';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const docClientMock = mockClient(DynamoDBDocumentClient);

describe('getProductListHandler', () => {  
  const mockEvent = {}; // Empty event, as we don't need specific data here

  beforeEach(() => {
    docClientMock.reset(); // Reset the mock client before each test
    // Ensure that the 'send' method is available and mocked correctly
    docClientMock.on(ScanCommand).resolves({ Items: [] }); // Mock a default ScanCommand response
  });

  it('should return 200 with a list of products joined with stock count', async () => {
    // Mock successful responses for products and stock data
    docClientMock.on(ScanCommand).resolvesOnce({
      Items: [
        { id: '1', title: 'Product A', description: 'Description A', price: 100 },
        { id: '2', title: 'Product B', description: 'Description B', price: 50 },
      ],
    })
    .resolvesOnce({
      Items: [
        { product_id: '1', count: 10 },
        { product_id: '2', count: 5 },
      ],
    });

    const result = await getProductListHandler(mockEvent as any);

    // Assert the response is correct
    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(body.length).toBe(2); // Expect 2 products
    expect(body[0].count).toBe(10); // Product A stock count should be 10
    expect(body[1].count).toBe(5);  // Product B stock count should be 5
  });

  it('should return 200 with a list of products with count 0 if no stock is available', async () => {
    // Mock successful responses for products, but no stock data
    docClientMock.on(ScanCommand).resolvesOnce({
      Items: [
        { id: '1', title: 'Product A', description: 'Description A', price: 100 },
        { id: '2', title: 'Product B', description: 'Description B', price: 50 },
      ],
    })
    .resolvesOnce({
      Items: [], // No stock data
    });

    const result = await getProductListHandler(mockEvent as any);

    // Assert that count is 0 for both products
    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(body[0].count).toBe(0); // Product A should have count 0
    expect(body[1].count).toBe(0); // Product B should have count 0
  });

  it('should return 500 if there is an error fetching products', async () => {
    // Simulate an error fetching products
    docClientMock.on(ScanCommand).rejects(new Error('Error fetching products'));

    const result = await getProductListHandler(mockEvent as any);

    // Assert that an error results in a 500 status code
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });

  it('should return 500 if there is an error fetching stock data', async () => {
    // Simulate successful product fetch but stock fetch fails
    docClientMock.on(ScanCommand).resolvesOnce({
      Items: [
        { id: '1', title: 'Product A', description: 'Description A', price: 100 },
        { id: '2', title: 'Product B', description: 'Description B', price: 50 },
      ],
    })
    .rejectsOnce(new Error('Stock fetch failed'));

    const result = await getProductListHandler(mockEvent as any);

    // Assert that error in stock fetch results in 500 status code
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});
