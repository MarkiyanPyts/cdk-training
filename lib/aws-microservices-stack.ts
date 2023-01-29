import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import { SwnApiGateway } from './apigateway';
import { SwnDatabase } from './database';
import { SwnMicroservices } from './microservice';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, 'Database')

    const microservices = new SwnMicroservices(this, 'Microservices', {
      productTable: database.productTable
    })

    const apigateway = new SwnApiGateway(this, 'ApiGateway', {
      productMicroservice: microservices.productMicroservice
    });
  }
}
