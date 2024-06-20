const path = require('path');
const express = require('express');
const http = require('http');
const os = require('os');
const socketio = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    addRoom,
    generateRoomCode,
    getAllRooms,
    getAllUsers,
    getRoomName,
    closeRoom,
    removeUser
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const botName = 'ChatCord Bot';
const messages = {}; // Nachrichten im Speicher speichern

// Maps to store the count of users, rooms, and messages over time
const userCountMap = new Map();
const roomCountMap = new Map();
const messageCountMap = new Map();

function updateCountMap(map, key) {
    const currentCount = map.get(key) || 0;
    map.set(key, currentCount + 1);
}

function getCurrentTimeKey() {
    return moment().format('HH:mm');
}

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

// Utility function to hash usernames
function hashUsername(username) {
    return crypto.createHash('sha256').update(username).digest('hex');
}

// Ensure the directory for CSV files exists
const csvDirectory = '/Users/maxbudde/chatdata';
if (!fs.existsSync(csvDirectory)) {
    fs.mkdirSync(csvDirectory, { recursive: true });
}

// Function to write messages to CSV
function writeMessagesToCsv(roomName, roomCode, messages) {
    const date = moment().format('YYYYMMDD');
    const fileName = `${roomName}_${roomCode}_${date}.csv`;
    const csvWriter = createCsvWriter({
        path: path.join(csvDirectory, fileName),
        header: [
            { id: 'username', title: 'USERNAME' },
            { id: 'time', title: 'TIME' },
            { id: 'text', title: 'TEXT' }
        ]
    });

    const data = messages.map(msg => ({
        username: hashUsername(msg.username),
        time: msg.time,
        text: msg.text
    }));

    return csvWriter.writeRecords(data).then(() => {
        console.log(`Messages for room ${roomName} (${roomCode}) have been written to CSV.`);
        return fileName;
    });
}

// API endpoint to download CSV file for active room
app.get('/api/download-csv/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    const roomName = getRoomName(roomCode);
    if (!roomName) {
        return res.status(404).json({ error: 'Room not found' });
    }

    const roomMessages = messages[roomCode] || [];
    if (roomMessages.length === 0) {
        return res.status(404).json({ error: 'No messages found for this room' });
    }

    try {
        const fileName = await writeMessagesToCsv(roomName, roomCode, roomMessages);
        const filePath = path.join(csvDirectory, fileName);
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
        });
    } catch (error) {
        console.error('Error writing messages to CSV:', error);
        res.status(500).json({ error: 'Error writing messages to CSV' });
    }
});

// API endpoint to fetch statistics
app.get('/api/statistics', (req, res) => {
    res.json({
        userCountMap: Array.from(userCountMap.entries()),
        roomCountMap: Array.from(roomCountMap.entries()),
        messageCountMap: Array.from(messageCountMap.entries()),
    });
});

app.post('/api/create-room', (req, res) => {
    const { roomName } = req.body;
    const roomCode = generateRoomCode();
    addRoom(roomCode, roomName);
    messages[roomCode] = []; // Initialisieren Sie den Nachrichtenpuffer für den Raum
    res.json({ roomCode });

    const timeKey = getCurrentTimeKey();
    updateCountMap(roomCountMap, timeKey);
});

app.post('/api/close-room', (req, res) => {
    const { roomCode } = req.body;
    const roomName = getRoomName(roomCode);
    const roomUsers = getRoomUsers(roomCode);
    roomUsers.forEach(user => {
        io.to(user.id).emit('roomClosed');
    });
    closeRoom(roomCode);
    writeMessagesToCsv(roomName, roomCode, messages[roomCode]); // Write messages to CSV on room close
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

        const timeKey = getCurrentTimeKey();
        updateCountMap(userCountMap, timeKey);

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
        const message = formatMessage(user.username, msg);

        // Speichern Sie die Nachricht im Speicher
        if (messages[user.room]) {
            messages[user.room].push(message);
        } else {
            messages[user.room] = [message];
        }

        const timeKey = getCurrentTimeKey();
        updateCountMap(messageCountMap, timeKey);

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
