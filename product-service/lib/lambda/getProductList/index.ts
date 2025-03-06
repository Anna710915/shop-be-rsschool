import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({region: "eu-west-1"});
const docClient = DynamoDBDocumentClient.from(client);

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;

export const getProductListHandler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    // Fetch all products from the "products" table
    const products = await docClient.send(
      new ScanCommand({
        TableName: productsTableName,
      })
    );
    console.log('Fetched product list:', products);

    // Fetch stock data from the "stocks" table
    const stocks = await docClient.send(
      new ScanCommand({
        TableName: stocksTableName,
      })
    );

    console.log('Fetched stock list:', stocks);

    // Join product and stock data
    const joinedProducts = products.Items?.map((product: any) => {
      const stock = stocks.Items?.find(
        (stock: any) => stock.product_id === product.id
      );
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: stock?.count || 0,
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (error) {
    console.error('Error fetching products or stocks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
