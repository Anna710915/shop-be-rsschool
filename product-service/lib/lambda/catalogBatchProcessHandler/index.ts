import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const REGION = 'eu-west-1';
const dynamoDB = new DynamoDBClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCKS_TABLE = process.env.STOCKS_TABLE!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

export const catalogBatchProcessHandler = async (event: any) => {
  try {
    console.log('Processing batch:', JSON.stringify(event.Records));

    const createdProducts = [];

    for (const record of event.Records) {
      const { title, description, price, count } = JSON.parse(record.body);
      
      // Categorize product based on price
      const priceCategory = price > 100 ? 'expensive' : 'budget';
      const productId = randomUUID();

      const productItem = {
        Put: {
          TableName: PRODUCTS_TABLE,
          Item: {
            id: { S: productId },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
          },
        },
      };

      const stockItem = {
        Put: {
          TableName: STOCKS_TABLE,
          Item: {
            product_id: { S: productId },
            count: { N: count.toString() },
          },
        },
      };

      // Perform transactional write to ensure consistency
      await dynamoDB.send(
        new TransactWriteItemsCommand({
          TransactItems: [productItem, stockItem],
        })
      );

      createdProducts.push({ id: productId, title, description, price, count, priceCategory });
    }

    // Send SNS notification if products were created
    if (createdProducts.length > 0) {
        for (const product of createdProducts) {
            await sns.send(
              new PublishCommand({
                TopicArn: SNS_TOPIC_ARN,
                Message: JSON.stringify(product),
                Subject: 'New Product Alert',
                MessageAttributes: {
                  priceCategory: {
                    DataType: 'String',
                    StringValue: product.priceCategory,
                  },
                },
              })
            );
        }
    }

    console.log('Batch processing completed.');
  } catch (error) {
    console.error('Error processing SQS event:', error);
  }
};
