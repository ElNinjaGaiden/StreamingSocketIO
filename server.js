var express     = require('express'),
    app         = express(),
    http        = require('http'),
    socketIO    = require('socket.io'),
    publicDir   = `${__dirname}/public`,
    port        = process.env.PORT || 5000,
    server, io, sockets = [];

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(`/${publicDir}/client.html`);
});

app.get('/streamer', (req, res) => {
    res.sendFile(`/${publicDir}/streamer.html`);
});

server = http.Server(app);
server.listen(port);

console.log(`Listening on port ${port}`);

io = socketIO(server);

io.on('connection', (socket) => {

    socket.emit('add-users', {
        users: sockets
    });

    socket.broadcast.emit('add-users', {
        users: [socket.id]
    });

    socket.on('make-offer', (data) => {
        socket.to(data.to).emit('offer-made', {
            offer: data.offer,
            socket: socket.id
        });
    });

    socket.on('make-answer', (data) => {
        socket.to(data.to).emit('answer-made', {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on('disconnect', () => {
        sockets.splice(sockets.indexOf(socket.id), 1);
        io.emit('remove-user', socket.id);
    });

    socket.on('stream-ready', () => {
        streamerSocket = socket.id;
        socket.emit('connect-clients', {
            clients: sockets.filter(s => s !== socket.id)
        });
    });

    socket.on('stop-stream', () => {

        socket.broadcast.emit('stream-end', {
            socket: socket.id
        });

        socket.emit('disconnect-clients', {
            clients: sockets.filter(s => s !== socket.id)
        });
    });

    sockets.push(socket.id);
});