const users = [];
const rooms = {};

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function addRoom(code, name) {
    rooms[code] = { name, users: [] };
}

function userJoin(id, username, room) {
    const user = { id, username, room };
    users.push(user);
    if (rooms[room]) {
        rooms[room].users.push(user);
    }
    return user;
}

function getCurrentUser(id) {
    return users.find((user) => user.id === id);
}

function userLeave(id) {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
        const user = users.splice(index, 1)[0];
        const room = rooms[user.room];
        if (room) {
            room.users = room.users.filter(u => u.id !== id);
        }
        return user;
    }
}

function getRoomUsers(room) {
    return rooms[room] ? rooms[room].users : [];
}

function getAllRooms() {
    return Object.entries(rooms).map(([code, { name }]) => ({ code, name }));
}

function getAllUsers() {
    return users;
}

function getRoomName(roomCode) {
    return rooms[roomCode] ? rooms[roomCode].name : null;
}

function closeRoom(roomCode) {
    if (rooms[roomCode]) {
        const roomUsers = rooms[roomCode].users;
        roomUsers.forEach(user => {
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
            }
        });
        delete rooms[roomCode];
    }
}

function removeUser(userId) {
    const user = userLeave(userId);
    if (user) {
        const room = rooms[user.room];
        if (room) {
            room.users = room.users.filter(u => u.id !== userId);
        }
    }
    return user;
}

module.exports = {
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
};


