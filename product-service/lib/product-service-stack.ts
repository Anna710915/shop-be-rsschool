import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

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
  }
}
