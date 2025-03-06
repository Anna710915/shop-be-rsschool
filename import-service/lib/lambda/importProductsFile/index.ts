import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'eu-west-1' });

export const importProductsFileHandler = async (event: any) => {
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ message: 'File name is required' }),
    };
  }

  const bucketName = process.env.BUCKET_NAME!;

  try {
    // Create the PutObjectCommand for the desired S3 object
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
      ContentType: 'text/csv',
    });

    // Generate a signed URL for the PutObjectCommand
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ signedUrl }), // Send the signed URL back
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
