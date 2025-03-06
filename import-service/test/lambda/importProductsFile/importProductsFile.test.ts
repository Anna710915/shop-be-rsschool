import { importProductsFileHandler } from '../../../lib/lambda/importProductsFile';
import { S3 } from 'aws-sdk';

describe('importProductsFileHandler', () => {
  let s3Mock: jest.Mocked<S3>;

  beforeEach(() => {
    s3Mock = new S3() as jest.Mocked<S3>;
    jest.spyOn(s3Mock, 'getSignedUrl').mockImplementation((_, params) => {
      return `https://s3.eu-west-1.amazonaws.com/${params.Bucket}/${params.Key}?signature=mocked`; 
    });
  });

  it('should return 400 if file name is missing', async () => {
    const mockEvent = { queryStringParameters: {} };
    const response = await importProductsFileHandler(mockEvent);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: 'File name is required' });
  });

  it('should return a signed URL if file name is provided', async () => {
    process.env.BUCKET_NAME = 'test-bucket';
    const mockEvent = { queryStringParameters: { name: 'test.csv' } };
    const response = await importProductsFileHandler(mockEvent);
    expect(response.statusCode).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    process.env.BUCKET_NAME = 'test-bucket';
    jest.spyOn(s3Mock, 'getSignedUrl').mockImplementation(() => {
      throw new Error('AWS Error');
    });
    const mockEvent = { queryStringParameters: { name: 'test.csv' } };
    await expect(importProductsFileHandler(mockEvent)).resolves.not.toThrow();
  });
});