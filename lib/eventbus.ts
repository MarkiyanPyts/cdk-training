import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { SqsQueue } from "aws-cdk-lib/aws-events-targets";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface SwnEventBusProps {
    publisherFunction: IFunction;
    targetQueue: IQueue;
}

export class SwnEventBus extends Construct {
    constructor(scope: Construct, id: string, props: SwnEventBusProps) {
        super(scope, id);

        const eventBus = new EventBus(this, 'SwnEventBus', {
            eventBusName: 'SwnEventBus'
          })
      
          const checkoutBasketRule = new Rule(this, 'CheckoutBasketRule', {
            eventBus: eventBus,
            enabled: true,
            description: 'When Basket Microservice checkout the basket',
            eventPattern: {
              source: ['com.swn.basket.checkoutbasket'],
              detailType: ['CheckoutBasket']
            },
            ruleName: 'CheckoutBasketRule'
          })
      
          checkoutBasketRule.addTarget(new SqsQueue(props.targetQueue))
          eventBus.grantPutEventsTo(props.publisherFunction)
    }
}