import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";

exports.handler = async function(event: any) {
    console.log("request:", JSON.stringify(event, undefined, 2));
    
    let body = "";
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await getBasket(event.pathParameters?.userName)
                } else if (event.pathParameters != null) {
                    body = await getAllBaskets()
                    // GET /product/{id}
                }
                break;
            case "POST":
                if (event?.path == "/basket/checkout") {
                    body = await checkoutBasket(event)
                } else {
                    body = await createBasket(event)
                }
                break;
            case "DELETE":
                body = await deleteBasket(event?.pathParameters?.userName)
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

const getBasket = async (userName: string): Promise<any> => {
    console.log('getBasket', userName)

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: marshall({userName: userName})
        }

        const {Item} = await ddbClient.send(new GetItemCommand(params));
        console.log('getBasket result', Item)
        return (Item) ? unmarshall(Item) : {};
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const getAllBaskets = async (): Promise<any> => {
    console.log('getAllBaskets')

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
        }

        const {Items} = await ddbClient.send(new ScanCommand(params));
        console.log('getAllBaskets result', Items)
        return (Items) ? Items : [];
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const createBasket = async (event: any): Promise<any> => {
    console.log('createBasket', event)

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: marshall(event.body)
        }

        const result = await ddbClient.send(new PutItemCommand(params));
        console.log('createBasket result', result)
        return result;
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const checkoutBasket = async (event: any): Promise<any> => {
    console.log('checkoutBasket', event)
}

const deleteBasket = async (userName: string): Promise<any> => {
    console.log('deleteBasket', userName)

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: marshall({userName: userName})
        }

        const result = await ddbClient.send(new DeleteItemCommand(params));
        console.log('deleteBasket result', result)
        return result;
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};