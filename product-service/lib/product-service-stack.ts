import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // getProductsList Lambda function
    const getProductListLambda = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.getProductListHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/getProductList'),
    });

    // getProductById Lambda function
    const getProductByIdLambda = new lambda.Function(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.getProductByIdHandler',
      code: lambda.Code.fromAsset('dist/lib/lambda/getProductById'),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ProductServiceAPI', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
        allowMethods: ['GET'], // Allow only GET method
        allowHeaders: ['Content-Type'], // Allow only necessary headers
      }
    });

    // /products endpoint
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductListLambda));

    // /products/{productId} endpoint
    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdLambda));
  }
}
