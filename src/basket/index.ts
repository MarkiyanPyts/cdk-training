import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient";

exports.handler = async function(event: any) {
    console.log("request:", JSON.stringify(event, undefined, 2));
    
    let body = "";
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters != null) {
                    body = await getBasket(event.pathParameters?.userName)
                } else {
                    body = await getAllBaskets()
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
        return (Items) ? Items.map((Item) => {return unmarshall(Item)}) : [];
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const createBasket = async (event: any): Promise<any> => {
    console.log('createBasket', event)

    try {
        const requestBody = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: marshall(requestBody || {})
        }

        const createResult = await ddbClient.send(new PutItemCommand(params));
        console.log('createBasket createResult', createResult)
        return createResult;
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const checkoutBasket = async (event: any): Promise<any> => {
    console.log('checkoutBasket', event)
    const checkoutRequest = JSON.parse(event.body);

    if (checkoutRequest == null || checkoutRequest?.userName == null) {
        throw new Error(`userNAame should exist in checkoutRequest ${checkoutRequest}}`);
    }
    const basket = await getBasket(checkoutRequest?.userName);

    const checkoutPayload = prepareOrderPayload(checkoutRequest, basket);
    const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);
    await deleteBasket(checkoutRequest?.userName);
}

const deleteBasket = async (userName: string): Promise<any> => {
    console.log('deleteBasket', userName)

    try {
        const params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            Key: marshall({userName: userName})
        }

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log('deleteBasket deleteResult', deleteResult)
        return deleteResult;
    } catch (e: any) {
        console.error(e);
        throw e;
    }
};

const prepareOrderPayload = (checkoutRequest: any, basket: any) => {    
    console.log("prepareOrderPayload");
    
    // prepare order payload -> calculate totalprice and combine checkoutRequest and basket items
    // aggregate and enrich request and basket data in order to create order payload    
    try {
        if (basket == null || basket.items == null) {
            throw new Error(`basket should exist in items: "${basket}"`);
        }
  
        // calculate totalPrice
        let totalPrice = 0;
        basket.items.forEach((item: { price: number; }) => totalPrice = totalPrice + item.price);
        checkoutRequest.totalPrice = totalPrice;
        console.log(checkoutRequest);
    
        // copies all properties from basket into checkoutRequest
        Object.assign(checkoutRequest, basket);
        console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
        return checkoutRequest;
  
      } catch(e) {
        console.error(e);
        throw e;
    }    
  }

  const publishCheckoutBasketEvent = async (checkoutPayload: any) => {
    console.log("publishCheckoutBasketEvent with payload :", checkoutPayload);
    try {
        // eventbridge parameters for setting event to target system
        const params = {
            Entries: [
                {
                    Source: process.env.EVENT_SOURCE,
                    Detail: JSON.stringify(checkoutPayload),
                    DetailType: process.env.EVENT_DETAILTYPE,
                    Resources: [ ],
                    EventBusName: process.env.EVENT_BUSNAME
                },
            ],
        };
     
        const data = await ebClient.send(new PutEventsCommand(params));
    
        console.log("Success, event sent; requestID:", data);
        return data;
    
      } catch(e) {
        console.error(e);
        throw e;
    }
  }