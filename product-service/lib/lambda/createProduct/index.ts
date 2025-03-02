import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { Product } from '../../../src/products';
import { Stock } from '../../../src/stocks';

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;

const client = new DynamoDBClient({region: "eu-west-1"});
const db = DynamoDBDocumentClient.from(client);

export const createProductHandler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    const { title, description, price, count } = JSON.parse(event.body);
    console.log('Parsed product and stock data:', { title, description, price, count });

    // Input validation for product data
    if (
      !title || title.trim() === "" ||
      !description || description.trim() === "" ||
      price === undefined || price === null || isNaN(price) || price <= 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid product data. Ensure that title, description, and price are provided. Price must be a positive number.',
        }),
      };
    }

    // Input validation for stock data
    if (count === undefined || count < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid stock data. Ensure that count is a non-negative number.',
        }),
      };
    }

    // Generate a new product ID using uuid
    const product: Product = {
      id: randomUUID(), // Generate a UUID for the new product
      title,
      description,
      price,
    };

    console.log('Generated new product:', product);

    // Create a new stock entry
    const stock: Stock = {
      product_id: product.id,
      count,
    };

    console.log('Generated new stock:', stock);

    // DynamoDB Transaction: Ensures atomicity for both product and stock creation
    const command = new TransactWriteCommand ({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: product,
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: stock,
            },
          },
        ],
    });
  
    // Execute the transaction
    await db.send(command);
  
    return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "POST",
        },
        body: JSON.stringify({
          message: 'Product and stock created successfully',
          productId: product.id,
          stockCount: stock.count,
        }),
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create product', error }),
    };
  }
};
