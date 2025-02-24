import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getProductListHandler } from '../../../lib/lambda/getProductList'; // Adjust the path as needed

describe('getProductListHandler', () => {
  it('should return a 200 status code and a list of products', async () => {
    // Mock event and context
    const event = {} as APIGatewayProxyEvent;
    
    // Call the handler
    const response: APIGatewayProxyResult = await getProductListHandler(event) as APIGatewayProxyResult;

    // Expectations
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('title');
    expect(body[0]).toHaveProperty('description');
    expect(body[0]).toHaveProperty('price');
  });
});
