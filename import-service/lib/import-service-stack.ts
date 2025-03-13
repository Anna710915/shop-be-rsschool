import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';
import { Construct } from 'constructs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for file uploads
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: 'shop-scv',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Create an IAM role for the Lambda function
    const lambdaS3Role = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'), 
      ],
    });

    const layers = [
      new lambda.LayerVersion(this, "NodeJsLayer", {
        code: lambda.Code.fromAsset(path.join(__dirname, "../layer")),
        compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
      }),
    ];

    // Define the Lambda function for importing files
    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.importProductsFileHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/importProductsFile'),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      }
    });

    // Grant permissions to the Lambda function to generate signed URLs
    importBucket.grantPut(importProductsFileLambda);
    importBucket.grantReadWrite(importProductsFileLambda);

    // API Gateway to expose the Lambda function
    const api = new apigateway.RestApi(this, 'ImportServiceAPI');

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda));

    // Enable CORS for the GET method of the import resource
    importResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS, 
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS, 
    });

    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.importFileParserHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/importFileParser'),
      role: lambdaS3Role, 
      layers
    });
    
    importBucket.grantPut(importFileParserLambda);
    importBucket.grantReadWrite(importFileParserLambda);
    
    // Add an event notification to trigger the Lambda when a file is uploaded
    importBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Notifications.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });
  }
}
