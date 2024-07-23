const path = require('path');
const express = require('express');
const http = require('http');
const os = require('os');
const socketio = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const CryptoJS = require('crypto-js');
const formatMessage = require('./utils/messages');
const formatQuestion = require('./utils/questions');
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

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const botName = 'ChatCord Bot';
const messages = {}; // Store messages in memory
const questions = {}; // Store questions in memory
const encryptionKey = 'ffdedd009668c3679b85433cc4c99d87194f27a484abbc56fd970188053e3fa5'; // Replace with a secure key test

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
const csvDirectory = path.join(os.homedir(), 'chatdata');
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

// Function to write questions to CSV
function writeQuestionsToCsv(roomName, roomCode, questions) {
    const date = moment().format('YYYYMMDD');
    const fileName = `${roomName}_${roomCode}_questions_${date}.csv`;
    const csvWriter = createCsvWriter({
        path: path.join(csvDirectory, fileName),
        header: [
            { id: 'username', title: 'USERNAME' },
            { id: 'time', title: 'TIME' },
            { id: 'text', title: 'TEXT' }
        ]
    });

    const data = questions.map(q => ({
        username: hashUsername(q.username),
        time: q.time,
        text: q.text
    }));

    return csvWriter.writeRecords(data).then(() => {
        console.log(`Questions for room ${roomName} (${roomCode}) have been written to CSV.`);
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

// API endpoint to download questions CSV file for active room
app.get('/api/download-questions-csv/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    const roomName = getRoomName(roomCode);
    if (!roomName) {
        return res.status(404).json({ error: 'Room not found' });
    }

    const roomQuestions = questions[roomCode] || [];
    if (roomQuestions.length === 0) {
        return res.status(404).json({ error: 'No questions found for this room' });
    }

    try {
        const fileName = await writeQuestionsToCsv(roomName, roomCode, roomQuestions);
        const filePath = path.join(csvDirectory, fileName);
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
        });
    } catch (error) {
        console.error('Error writing questions to CSV:', error);
        res.status(500).json({ error: 'Error writing questions to CSV' });
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
    messages[roomCode] = []; // Initialize message buffer for the room
    questions[roomCode] = []; // Initialize question buffer for the room
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
    writeQuestionsToCsv(roomName, roomCode, questions[roomCode]); // Write questions to CSV on room close
    delete messages[roomCode]; // Remove messages of the closed room
    delete questions[roomCode]; // Remove questions of the closed room
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

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password === adminPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});

const usersWithNotificationSupport = new Map();

io.on('connection', (socket) => {
    // Listen for notification support information
    socket.on('notificationSupport', ({ notificationSupported }) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            usersWithNotificationSupport.set(user.id, notificationSupported);
        }
    });

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        const roomName = getRoomName(room);
        socket.join(user.room);

        const timeKey = getCurrentTimeKey();
        updateCountMap(userCountMap, timeKey);

        let welcomeMessage = 'Welcome to ChatCord!';
        let encryptedWelcomeMessage = encryptMessage(welcomeMessage);
        socket.emit('message', formatMessage(botName, encryptedWelcomeMessage));

        socket.emit('ipAddress', ipAddress);

        socket.emit('roomData', { roomName, roomCode: room });

        let joinMessage = `${user.username} has joined the chat`;
        let encryptedJoinMessage = encryptMessage(joinMessage);
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, encryptedJoinMessage));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    socket.on('chatMessage', ({ text, sender }) => {
        const user = getCurrentUser(socket.id);
        const decryptedMsg = decryptMessage(text);
        const message = formatMessage(user.username, decryptedMsg);

        // Save the message in memory
        if (messages[user.room]) {
            messages[user.room].push(message);
        } else {
            messages[user.room] = [message];
        }

        const timeKey = getCurrentTimeKey();
        updateCountMap(messageCountMap, timeKey);

        const encryptedMessage = encryptMessage(message.text);

        // Send the message to the sender
        socket.emit('message', { ...message, text: encryptedMessage });

        // Send the message to all other users in the room
        socket.broadcast.to(user.room).emit('message', { ...message, text: encryptedMessage });

        // Send push notification to all other users in the room except the sender if they support notifications
        getRoomUsers(user.room).forEach(roomUser => {
            if (roomUser.id !== user.id && usersWithNotificationSupport.get(roomUser.id)) {
                io.to(roomUser.id).emit('pushNotification', {
                    title: `Message from ${user.username}`,
                    body: decryptedMsg,
                    sender: user.username // Include the sender's username in the push notification
                });
            }
        });
    });

    socket.on('question', ({ text, sender }) => {
        const user = getCurrentUser(socket.id);
        const decryptedMsg = decryptMessage(text);
        const question = formatQuestion(user.username, decryptedMsg);

        // Save the question in memory
        if (questions[user.room]) {
            questions[user.room].push(question);
        } else {
            questions[user.room] = [question];
        }

        const timeKey = getCurrentTimeKey();
        updateCountMap(messageCountMap, timeKey);

        const encryptedQuestion = encryptMessage(question.text);

        // Send the question to the sender
        socket.emit('question', { ...question, text: encryptedQuestion });

        // Send the question to all other users in the room
        socket.broadcast.to(user.room).emit('question', { ...question, text: encryptedQuestion });

        // Send push notification to all other users in the room except the sender if they support notifications
        getRoomUsers(user.room).forEach(roomUser => {
            if (roomUser.id !== user.id && usersWithNotificationSupport.get(roomUser.id)) {
                io.to(roomUser.id).emit('pushNotification', {
                    title: `Question from ${user.username}`,
                    body: decryptedMsg,
                    sender: user.username
                });
            }
        });
    });

    socket.on('leaveRoom', () => {
        const user = getCurrentUser(socket.id);
        if (user) {
            userLeave(socket.id);

            let leaveMessage = `${user.username} has left the chat`;
            let encryptedLeaveMessage = encryptMessage(leaveMessage);
            io.to(user.room).emit('message', formatMessage(botName, encryptedLeaveMessage));

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
            let leaveMessage = `${user.username} has left the chat`;
            let encryptedLeaveMessage = encryptMessage(leaveMessage);
            io.to(user.room).emit('message', formatMessage(botName, encryptedLeaveMessage));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });

    // New route to update colors
    socket.on('updateColors', (colors) => {
        io.emit('colorsUpdated', colors); // Broadcast to all connected clients
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, encryptionKey).toString();
}

function decryptMessage(cipherText) {
    const bytes = CryptoJS.AES.decrypt(cipherText, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Collect data points every minute
setInterval(() => {
    const timeKey = getCurrentTimeKey();
    updateCountMap(userCountMap, timeKey);
    updateCountMap(roomCountMap, timeKey);
    updateCountMap(messageCountMap, timeKey);
}, 60000);
