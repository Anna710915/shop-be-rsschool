import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({region: "eu-west-1"});
const docClient = DynamoDBDocumentClient.from(client);

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;

export const getProductByIdHandler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    const { productId } = event.pathParameters;
    // Fetch the product by ID from the "products" table
    const product = await docClient.send(
      new GetCommand({
        TableName: productsTableName,
        Key: { id: productId },
      })
    );

    // Fetch the stock for the product from the "stocks" table
    const stock = await docClient.send(
      new GetCommand({
        TableName: stocksTableName,
        Key: { product_id: productId },
      })
    );

    if (!product.Item || !stock.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    // Combine product and stock data
    const joinedProduct = {
      id: product.Item.id,
      title: product.Item.title,
      description: product.Item.description,
      price: product.Item.price,
      count: stock.Item.count,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(joinedProduct),
    };
  } catch (error) {
    console.error('Error fetching product or stock:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
