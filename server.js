const PORT = process.env.PORT || 8080;
const INDEX = '/index.html';
const express = require('express');
const { Server } = require('ws');
const ip = require('ip');

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

let connections = [];

wss.on('connection', wss => {
    const id = Math.floor(Math.random() * 100);

    connections.forEach(client => client.connection.send(JSON.stringify({
        client: id,
        text: 'I am now connected',
    })));
    connections.push({ connection: wss, id });

    console.log(`Client-${id} connected`)

    wss.on('message', message => {
        connections
            .filter(client => client.id !== id)
            .forEach(client => client.connection.send(JSON.stringify({
                client: id,
                text: JSON.parse(message),
            })));
        console.log(`Client-${id} broadcast message ${message}`)
    });

    wss.on('close', () => {
        connections = connections.filter(client => client.id !== id);
        connections.forEach(client => client.connection.send(JSON.stringify({
            client: id,
            text: `I disconnected`,
        })));
        console.log(`Client-${id} disconnected`)
    });
});

/*
setInterval(() => {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            text: `Ping - ${new Date().toTimeString()}`,
        }));
    });
}, 1000);
*/

console.log('server start.' + ' ipaddress = ' + ip.address() + ' port = ' + PORT);
