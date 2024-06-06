const path = require('path');
const express = require('express');
const http = require('http');
const os = require('os');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, addRoom, generateRoomCode, getAllRooms, getAllUsers, getRoomName, closeRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const botName = 'ChatCord Bot';

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
    res.json({ roomCode });
});

app.post('/api/close-room', (req, res) => {
    const { roomCode } = req.body;
    const roomUsers = getRoomUsers(roomCode);
    roomUsers.forEach(user => {
        io.to(user.id).emit('roomClosed');
    });
    closeRoom(roomCode);
    res.json({ success: true });
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

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
