import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import products from "./products";
import stocks from "./stocks";

const client = new DynamoDBClient({ region: "eu-west-1" });
const docClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = "products";
const STOCKS_TABLE = "stocks";

export const insertProducts = async () => {
    try {
        for (const product of products) {
            const command = new PutCommand({
                TableName: PRODUCTS_TABLE,
                Item: product,
            });
    
            await docClient.send(command);
            console.log(`Inserted product: ${product.title}`);
        }
    
        console.log("All products inserted successfully.");
    } catch (error) {
        console.error("Error inserting products:", error);
    }
};

// Function to Insert Stocks
const insertStocks = async () => {
    try {
        for (const stock of stocks) {
            const command = new PutCommand({
                TableName: STOCKS_TABLE,
                Item: stock,
            });
  
            await docClient.send(command);
            console.log(`Inserted stock for product_id: ${stock.product_id}`);
        }
  
        console.log("All stocks inserted successfully.");
    } catch (error) {
        console.error("Error inserting stocks:", error);
    }
};
  
insertProducts();
insertStocks();
