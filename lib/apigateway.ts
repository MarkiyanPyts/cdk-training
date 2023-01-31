import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs'

interface SwnApiGatewayProps {
    productMicroservice: IFunction
    basketMicroservice: IFunction
}

export class SwnApiGateway extends Construct {
    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        this.createProductApi(props.productMicroservice)
        this.createBasketApi(props.basketMicroservice)

        
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
        singleBasket.addMethod('POST')// POST /basket/checkout
    }
}