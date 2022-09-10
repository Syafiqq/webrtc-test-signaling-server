const PORT = process.env.PORT || 8080;
const INDEX = '/index.html';
const express = require('express');
const { Server } = require('ws');
const ip = require('ip');

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('close', () => console.log('Client disconnected'));

    ws.on('message', function (message) {
        const json = JSON.parse(message.toString());
        console.log('-- message recieved -- ' + message);
        ws.clients && ws.clients.forEach(function each(client) {
            if (isSame(ws, client)) {
                console.log('skip sender');
            }
            else {
                client.send(message);
            }
        });
    });
});
function isSame(ws1, ws2) {
    // -- compare object --
    return (ws1 === ws2);
}
setInterval(() => {
    wss.clients.forEach((client) => {
        client.send(new Date().toTimeString());
    });
}, 2000);



console.log('server start.' + ' ipaddress = ' + ip.address() + ' port = ' + PORT);
