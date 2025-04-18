import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context, StatementEffect } from 'aws-lambda';

const generatePolicy = (principalId: string, effect: StatementEffect, resource: string): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};

export const handler = async (event: APIGatewayTokenAuthorizerEvent, context: Context): Promise<APIGatewayAuthorizerResult> => {
  console.log('event', JSON.stringify(event));
  if (!event.authorizationToken) {
      console.error('Missing authorization token');
      throw new Error(JSON.stringify({ status: 401, message: 'Unauthorized: Missing token' }));
  }

  const token = event.authorizationToken.split(' ')[1];
  if (!token) {
      console.error('Missing token value');
      throw new Error(JSON.stringify({ status: 401, message: 'Unauthorized: Missing token value' }));
  }
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    console.log('decoded', decoded);
    const [username, password] = decoded.split('=');
  
    const validPassword = process.env[`${username}`];
    console.log('validPassword', validPassword);
    if (validPassword && password.trim() === validPassword.trim()) {
        return generatePolicy(username, 'Allow', event.methodArn);
    }
    console.log('Deny');
    return generatePolicy(username, 'Deny', event.methodArn);
  };