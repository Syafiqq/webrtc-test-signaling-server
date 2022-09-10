const PORT = process.env.PORT || 8080;
const INDEX = '/index.html';
const express = require('express');
const { Server } = require('ws');
const ip = require('ip');

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });
let clients = [];

wss.on('request', request => {
    const wss = request.accept();
    const id = Math.floor(Math.random() * 100);

    clients.forEach(client => client.connection.send(JSON.stringify({
        client: id,
        text: 'I am now connected',
    })));
    clients.push({ connection: wss, id });

    console.log(`Client-${id} connected`)

    wss.on('message', message => {
        clients
            .filter(client => client.id !== id)
            .forEach(client => client.connection.send(JSON.stringify({
                client: id,
                text: message.utf8Data,
            })));
        console.log(`Client-${id} broadcast message`)
    });

    wss.on('close', () => {
        clients = clients.filter(client => client.id !== id);
        clients.forEach(client => client.connection.send(JSON.stringify({
            client: id,
            text: `I disconnected`,
        })));
        console.log(`Client-${id} disconnected`)
    });
});

setInterval(() => {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            text: `Ping - ${new Date().toTimeString()}`,
        }));
    });
}, 1000);

console.log('server start.' + ' ipaddress = ' + ip.address() + ' port = ' + PORT);
