const path = require('path');
const express = require('express');
const http = require('http');
const os = require('os');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, addRoom, generateRoomCode, getAllRooms, getAllUsers, getRoomName, closeRoom, removeUser } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// server.js

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


const botName = 'ChatCord Bot';

const messages = {}; // Nachrichten im Speicher speichern

function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; iface && i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}

const ipAddress = getIPAddress();
console.log(`Server running on IP: ${ipAddress}`);

app.post('/api/create-room', (req, res) => {
    const { roomName } = req.body;
    const roomCode = generateRoomCode();
    addRoom(roomCode, roomName);
    messages[roomCode] = []; // Initialisieren Sie den Nachrichtenpuffer für den Raum
    res.json({ roomCode });
});

app.post('/api/close-room', (req, res) => {
    const { roomCode } = req.body;
    const roomUsers = getRoomUsers(roomCode);
    roomUsers.forEach(user => {
        io.to(user.id).emit('roomClosed');
    });
    closeRoom(roomCode);
    delete messages[roomCode]; // Entfernen Sie die Nachrichten des geschlossenen Raums
    res.json({ success: true });
});

app.post('/api/remove-user', (req, res) => {
    const { userId } = req.body;
    const user = removeUser(userId);
    if (user) {
        io.to(user.id).emit('userRemoved');
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.get('/api/admin-data', (req, res) => {
    res.json({
        rooms: getAllRooms(),
        users: getAllUsers()
    });
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        const roomName = getRoomName(room);
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
        socket.emit('ipAddress', ipAddress);

        socket.emit('roomData', { roomName, roomCode: room });

        // Senden Sie die bisherigen Nachrichten an den neuen Benutzer
        if (messages[room]) {
            messages[room].forEach(message => socket.emit('message', message));
        }

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        const message = formatMessage(user.username, msg);

        // Speichern Sie die Nachricht im Speicher
        if (messages[user.room]) {
            messages[user.room].push(message);
        }

        io.to(user.room).emit('message', message);
    });

    socket.on('leaveRoom', () => {
        const user = getCurrentUser(socket.id);
        if (user) {
            userLeave(socket.id);
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });

    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id);
        if (user) {
            userLeave(socket.id);
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });

    // Neue Route, um die Farben zu aktualisieren
    socket.on('updateColors', (colors) => {
        io.emit('colorsUpdated', colors); // Broadcast an alle verbundenen Clients
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
