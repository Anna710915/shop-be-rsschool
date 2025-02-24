import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductByIdHandler } from '../../../lib/lambda/getProductById';

describe('getProductByIdHandler', () => {
  it('should return a 200 response with the correct product', async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      pathParameters: { productId: "1" },
    };

    const response: APIGatewayProxyResult = await getProductByIdHandler(mockEvent as APIGatewayProxyEvent);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('id', "1");
    expect(body).toHaveProperty('title', "Chocolate Truffle");
  });

  it('should return a 404 response when the product is not found', async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      pathParameters: { productId: "999" },
    };

    const response: APIGatewayProxyResult = await getProductByIdHandler(mockEvent as APIGatewayProxyEvent);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(404);
    expect(response.headers).toMatchObject({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('message', 'Product not found');
  });
});
