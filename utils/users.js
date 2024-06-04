const users = [];
const rooms = {};

// Generate a 6-digit room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Add room
function addRoom(code, name) {
    rooms[code] = { name, users: [] };
    console.log(`Room added: ${name} with code ${code}`);
}

// Join user to chat
function userJoin(id, username, room) {
    const user = { id, username, room };
    users.push(user);

    if (rooms[room]) {
        rooms[room].users.push(user);
    }

    return user;
}

// Get current user
function getCurrentUser(id) {
    return users.find((user) => user.id === id);
}

// User leaves chat
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

// Get room users
function getRoomUsers(room) {
    return rooms[room] ? rooms[room].users : [];
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    addRoom,
    generateRoomCode,
};
