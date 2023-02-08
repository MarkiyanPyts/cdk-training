import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs'

interface SwnApiGatewayProps {
    productMicroservice: IFunction
    basketMicroservice: IFunction
    orderMicroservice: IFunction
}

export class SwnApiGateway extends Construct {
    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        this.createProductApi(props.productMicroservice)
        this.createBasketApi(props.basketMicroservice)
        this.createOrderingApi(props.orderMicroservice)
    }

    private createProductApi(productMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productMicroservice,
            proxy: false
        })

        const product = apigw.root.addResource('product')
        product.addMethod('GET')
        product.addMethod('POST')

        const singleProduct = product.addResource('{id}') // product/{id} is a path parameter
        singleProduct.addMethod('GET')// GET /product/{id}
        singleProduct.addMethod('PUT')// PUT /product/{id}
        singleProduct.addMethod('DELETE')// DELETE /product/{id}
    }

    private createBasketApi(basketMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketMicroservice,
            proxy: false
        })

        const basket = apigw.root.addResource('basket')
        basket.addMethod('GET')
        basket.addMethod('POST')

        const singleBasket = basket.addResource('{userName}') // basket/{userName} is a path parameter
        singleBasket.addMethod('GET')// GET /basket/{userName}
        singleBasket.addMethod('DELETE')// DELETE /basket/{userName}

        const basketCheckout = basket.addResource('checkout') 
        basketCheckout.addMethod('POST')// POST /basket/checkout
    }

    private createOrderingApi(orderingMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'orderApi', {
            restApiName: 'Order Service',
            handler: orderingMicroservice,
            proxy: false
        })

        const order = apigw.root.addResource('order')
        order.addMethod('GET')

        const singleOrder = order.addResource('{userName}') // order/{userName} is a path parameter
        singleOrder.addMethod('GET')// GET /order/{userName}

        return singleOrder
    }
}