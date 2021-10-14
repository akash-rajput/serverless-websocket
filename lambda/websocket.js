import Client from '../helper/client';
import Topic from '../helper/topic';

export async function handler(event) {
    try {
        console.log(`Received socket connectionId: ${event.requestContext && event.requestContext.connectionId}`);
        if (!(event.requestContext && event.requestContext.connectionId)) {
            throw new Error('Invalid event. Missing `connectionId` parameter.');
        }
        const connectionId = event.requestContext.connectionId;
        const route = event.requestContext.routeKey;
        console.log(`data from ${connectionId} ${event.body}`);

        const connection = new Client(connectionId);
        const response = { statusCode: 200, body: '' };

        if (route === '$connect') {
            console.log(`Route ${route} - Socket connectionId conected: ${event.requestContext && event.requestContext.connectionId}`);
            await new Client(connectionId).connect();
            return response;
        } else if (route === '$disconnect') {
            console.log(`Route ${route} - Socket connectionId disconnected: ${event.requestContext && event.requestContext.connectionId}`);
            await new Client(connectionId).unsubscribe();
            return response;
        } else {
            console.log(`Route ${route} - data from ${connectionId}`);
            if (!event.body) {
                return response;
            }

            let body = JSON.parse(event.body);

            const topic = body.topic;

            if (body.type === 'subscribe') {
                connection.subscribe({ topic });
                console.log(`Client subscribing for topic: ${topic}`);
            }

            if (body.type === 'message') {
                await new Topic(topic).publishMessage({ data: body.message });
                console.error(`Published messages to subscribers`);
                return response;
            }

            if (body.type === 'stop') {
                return response;
            }

            return response;
        }
    } catch (err) {
        console.error(err.message);
    }

    return null;
}
