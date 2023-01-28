import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { v4 as uuidv4 } from 'uuid';

exports.handler = async function(event: any) {
    let body = "";
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.queryStringParameters != null) {
                    body = await getProductsByCategory(event)
                } else if (event.pathParameters != null) {
                    body = await getProduct(event.pathParameters.id)
                    // GET /product/{id}
                } else {
                    body = await getAllProducts()
                }
                break;
            case "POST":
                body = await createProduct(event)
                break;
            case "PUT":
                body = await updateProduct(event)
                break;
            case "DELETE":
                body = await deleteProduct(event.pathParameters.id)
                break;
            default:
                throw new Error(`Unsupported route "${event.httpMethod}"`);
        }

        console.log(body);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body
            })
        };
    } catch (e: any) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            })
        };
    } 
};

const getProduct = async (producId: string): Promise<any> => {
    console.log('getProduct', producId)

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: marshall({id: producId})
        }

        const { Item } = await ddbClient.send(new GetItemCommand(params))

        console.log('Item', Item)
        return (Item) ? unmarshall(Item) : {}
        // get product from dynamodb
    } catch (error) {
        console.log('error', error)
    }
    // get product from dynamodb
    return 'getProduct'
}

const getAllProducts = async (): Promise<any> => {
    console.log('getProducts')

    try {
        
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
        }

        const { Items } = await ddbClient.send(new ScanCommand(params))

        console.log(Items)
        return (Items) ? Items.map((item: any) => unmarshall(item)) : []
    } catch (error) {
        console.log('error', error)
    }
    // get product from dynamodb
    return 'getProducts'
}

const createProduct = async (event: any): Promise<any> => {
    console.log('createProduct', event)

    try {
        const productRequest = JSON.parse(event.body)
        const productId = uuidv4()
        productRequest.id = productId;
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: marshall(productRequest || {})
        }

        const createResult = await ddbClient.send(new PutItemCommand(params))
        console.log(createResult)
        return productRequest
    } catch (error) {
        console.log('error', error)
    }
    // get product from dynamodb
    return 'createProduct'
}

const deleteProduct = async (id: string): Promise<any> => {
    console.log('deleteProduct', id)
    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: marshall({id: id})
        }

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params))
        console.log(deleteResult)
        return deleteResult
    } catch (error) {
        console.error('error', error)
        throw error;
    }
}

const updateProduct = async (event: any): Promise<any> => {
    console.log('updateProduct', event)
    try {
        const requestBody = JSON.parse(event.body);
        const objKeys = Object.keys(requestBody);
        console.log(`updateProduct function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);    

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ id: event.pathParameters.id }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: requestBody[key],
            }), {})),
        };

        const updateResult = await ddbClient.send(new UpdateItemCommand(params));

        console.log(updateResult);
        return updateResult;
    } catch (error) {
        console.error('error', error)
        throw error;
    }
    // get product from dynamodb
}

const getProductsByCategory = async (event: any): Promise<any> => {
    console.log('getProductsByCategory', event)

    try {
        const productId = event.pathParameters.id
        const category = event.queryStringParameters.category
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            IndexName: "category-index",
            KeyConditionExpression: "id = :productId",
            FilterExpression: "contains (category, :category)",
            ExpressionAttributeValues: {
                ":category": category,
                ":productId": productId
            }
        }

        const { Items } = await ddbClient.send(new QueryCommand(params))

        console.log(Items)
        return (Items) ? Items.map((item: any) => unmarshall(item)) : []
    } catch (error) {
        console.log('error', error)
    }
    // get product from dynamodb
    return 'getProductsByCategory'
}