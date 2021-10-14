const WebSocket = require('ws');

const sockedEndpoint = 'http://0.0.0.0:3001';
const ws1 = new WebSocket(sockedEndpoint, {
  perMessageDeflate: false
});

const ws2 = new WebSocket(sockedEndpoint, {
  perMessageDeflate: false
});

ws1.on('open', () => {
    console.log('WS1 connected');
    let count = 0;
    setInterval(() => {
      const data = {
        type: 'message',
        message: `count is ${count}`,
        topic: 'general'
      }
      const message  = JSON.stringify(data);
      ws1.send(message, (err) => {
        if(err) {
          console.log(`Error occurred while send data ${err.message}`)
        }
        console.log(`WS1 OUT ${message}`);
      })
      count++;
    }, 5000)
})

ws2.on('open', () => {
  console.log('WS2 connected');
  const data = {
    type: 'subscribe',
    topic: 'general'
  }
  ws2.send(JSON.stringify(data), (err) => {
    if(err) {
      console.log(`Error occurred while send data ${err.message}`)
    }
  })
})


ws2.on('message', ( message) => {
  console.log(`ws2 IN ${message}`);
})


