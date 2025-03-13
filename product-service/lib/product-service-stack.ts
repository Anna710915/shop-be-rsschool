import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();

const expensiveProductEmail = process.env.EXPENSIVE_PRODUCT_EMAIL!;
const budgetProductEmail = process.env.BUDGET_PRODUCT_EMAIL!;

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // DynamoDB Tables
    const productsTable =  dynamodb.Table.fromTableName(this, 'ProductTable', 'products');

    const stocksTable = dynamodb.Table.fromTableName(this, 'StockTable', 'stocks');

    // getProductsList Lambda function
    const getProductListLambda = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.getProductListHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/getProductList'),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    // getProductById Lambda function
    const getProductByIdLambda = new lambda.Function(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.getProductByIdHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/getProductById'),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    // createProduct Lambda function
    const createProductLambda = new lambda.Function(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.createProductHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/createProduct'),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      }
    });

    

    // Grant Lambda permissions to access DynamoDB tables
    productsTable.grantReadData(getProductListLambda);
    stocksTable.grantReadData(getProductListLambda);
    productsTable.grantReadData(getProductByIdLambda);
    stocksTable.grantReadData(getProductByIdLambda);

    // Grant the Lambda function permissions to write to the Products table
    productsTable.grantWriteData(createProductLambda);
    stocksTable.grantWriteData(createProductLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ProductServiceAPI', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
        allowMethods: ['GET', 'POST'], // Allow GET and POST methods
        allowHeaders: ['Content-Type'], // Allow only necessary headers
      },
    });

    // /products endpoint
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductListLambda));

    // /products/{productId} endpoint
    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdLambda));

    // /products endpoint (POST for creating a product)
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    // Create SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(1),
    });

    // Create SNS Topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'createProductTopic',
    });

     // Email subscription for expensive products
    createProductTopic.addSubscription(
      new subs.EmailSubscription(expensiveProductEmail, {
        filterPolicy: {
          priceCategory: sns.SubscriptionFilter.stringFilter({
            allowlist: ['expensive'],
          }),
        },
      })
    );

    // Email subscription for budget-friendly products
    createProductTopic.addSubscription(
      new subs.EmailSubscription(budgetProductEmail, {
        filterPolicy: {
          priceCategory: sns.SubscriptionFilter.stringFilter({
            allowlist: ['budget'],
          }),
        },
      })
    );

    // Export topic ARN for Lambda use
    new cdk.CfnOutput(this, 'CreateProductTopicArn', {
      value: createProductTopic.topicArn,
    });

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
      ],
    });

    // Grant Permissions
    catalogItemsQueue.grantConsumeMessages(lambdaRole);
    createProductTopic.grantPublish(lambdaRole);

    // Create Lambda Function
    const catalogBatchProcessLambda = new lambda.Function(this, 'CatalogBatchProcessLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.catalogBatchProcessHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/catalogBatchProcessHandler'),
      role: lambdaRole,
      environment: {
        SNS_TOPIC_ARN: createProductTopic.topicArn,
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    // Configure SQS Trigger for Lambda
    catalogBatchProcessLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );
  }
}
