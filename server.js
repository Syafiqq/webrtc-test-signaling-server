const PORT = process.env.PORT || 8081;
const INDEX = '/index.html';
const express = require('express');
const https = require('https')
const { Server } = require('ws');
const ip = require('ip');
const fs = require('fs')
const {json} = require("express");

const privateKey = fs.readFileSync( 'localhost+2-key.pem' );
const certificate = fs.readFileSync( 'localhost+2.pem' );

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    //.listen(PORT, () => console.log(`Listening on ${PORT}`));
const sslServer = https.createServer({
    key: privateKey,
    cert: certificate
}, server).listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server: sslServer });

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

let connections = [];
let publishId = undefined
let publishSdp = undefined
let publishJsonMessage = undefined

wss.on('connection', wss => {
    const id = Math.floor(Math.random() * 100);

    /*connections.forEach(client => client.connection.send(JSON.stringify({
        client: id,
        text: 'I am now connected',
    })));*/
    connections.push({ connection: wss, id });

    console.log(`Client-${id} connected`)

    wss.on('message', message => {
        console.log(`Client-${id} broadcast message ${message}`)
        let jsonMessage = JSON.parse(message)
        if (jsonMessage.direction === 'publish') {
            publishSdp = jsonMessage.sdp.sdp
            publishId = id
            publishJsonMessage = jsonMessage
            /*connections
                .filter(client => client.id === id)
                .forEach(client => client.connection.send(JSON.stringify({
                    status: 200,
                    direction: 'start',
                    command: 'sendResponse',
                })));*/
        } else if (jsonMessage.direction === 'play') {
            if (jsonMessage.command === 'getOffer' ) {
                connections
                    .filter(client => client.id === id)
                    .forEach(client => client.connection.send(JSON.stringify({
                        ...publishJsonMessage,
                        status: 200,
                        direction: 'play',
                        command: 'getOffer',
                    })));
            } else if (jsonMessage.command === 'sendResponse' ) {
                connections
                    .filter(client => client.id === publishId)
                    .forEach(client => client.connection.send(JSON.stringify({
                        status: 200,
                        direction: 'play',
                        command: 'getResponse',
                        streamInfo: jsonMessage.streamInfo,
                        sdp: {
                            sdp: jsonMessage.sdp.sdp,
                            type: 'answer'
                        },
                        userData: jsonMessage.userData,
                        iceCandidates: jsonMessage.iceCandidates
                    })));
            }
        }
        /*connections
            .filter(client => client.id !== id)
            .forEach(client => client.connection.send(JSON.stringify({
                ...JSON.parse(message),
            })));*/
    });

    wss.on('close', () => {
        connections = connections.filter(client => client.id !== id);
        /*connections.forEach(client => client.connection.send(JSON.stringify({
            client: id,
            text: `I disconnected`,
        })));*/
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
