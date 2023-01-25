import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { v4 as uuidv4 } from 'uuid';

exports.handler = async function(event: any) {
    let body = "";
    switch (event.httpMethod) {
        case "GET":
            if (event.pathParameters != null) {
                body = await getProduct(event.pathParameters.id)
                // GET /product/{id}
            } else {
                body = await getAllProducts()
            }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `Hello from Product ! You've hit ${event.path}\n`
    };
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

const getProducts = (): string => {
    console.log('getProducts')

    try {
        
        // get product from dynamodb
    } catch (error) {
        console.log('error', error)
    }
    // get product from dynamodb
    return 'getProducts'
}