import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'; // Import specific S3 client
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as csv from 'csv-parser';
import { console } from 'inspector';

const REGION = 'eu-west-1';
const s3 = new S3Client({ region: REGION });
const sqs = new SQSClient({ region: REGION });

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

export const importFileParserHandler = async (event: any) => {
  try {
    console.log(SQS_QUEUE_URL);
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing file: s3://${bucketName}/${objectKey}`);

      // Fetch the file from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      });

      // Get object from S3
      const { Body } = await s3.send(getObjectCommand);
      const s3Stream = Body as NodeJS.ReadableStream;

      const records: any[] = [];

      // Collect all CSV rows into an array using a Promise
      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on('data', async (data) => {
            const product = {
              id: data.id,
              title: data.title,
              description: data.description,
              price: Number(data.price),
              count: Number(data.count),
            };

            const sqsCommand = new SendMessageCommand({
              QueueUrl: SQS_QUEUE_URL,
              MessageBody: JSON.stringify(product),
            });

            try {
              await sqs.send(sqsCommand);
            } catch (err) {
              console.error('Error sending message to SQS:', err);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      console.log('CSV file processing completed.');

      // Define the new key for the 'parsed' folder
      const newKey = `parsed/${objectKey.split('/')[1]}`; // Move to the 'parsed' folder, keeping the file name

      // Copy the file to the 'parsed' folder
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${objectKey}`,
        Key: newKey,
      });
      await s3.send(copyCommand);
      console.log(`File copied to parsed folder: s3://${bucketName}/${newKey}`);

      // Delete the original file from the 'uploaded' folder
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      await s3.send(deleteCommand);
      console.log(`Original file deleted from uploaded folder: s3://${bucketName}/${objectKey}`);
    }
  } catch (error) {
    console.error('Error handling S3 event:', error);
  }
};
