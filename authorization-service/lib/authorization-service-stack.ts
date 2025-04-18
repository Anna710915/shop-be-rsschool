import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new lambda.Function(this, 'BasicAuthorizerLambda', {
      handler: 'basicAuthorizer.handler',
      functionName: 'authLambdaFunction',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(join(__dirname, '../dist/lib')),
      environment: {
        'Anna710915': process.env.Anna710915 || '',
      },
    });
  }
}
