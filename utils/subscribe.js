import { PubSub } from 'graphql-subscriptions';

import Client from '../model/client';

// const subscribeResolver = (topic) => async ({ id }: any, _args: any, { connectionId, ttl }: any) => {
//   await new Client(connectionId).subscribe({
//     ttl,
//     topic,
//     subscriptionId: id,
//   });
//   return new PubSub().asyncIterator([topic]);
// };

// export default subscribeResolver;
