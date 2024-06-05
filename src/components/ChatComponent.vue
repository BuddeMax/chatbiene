<template>
  <div class="chat-container">
    <header class="chat-header">
      <h1>Chat Room: {{ roomName }}</h1>
      <button @click="leaveRoom" class="btn">Leave Room</button>
      <div class="server-ip">Server IP: {{ ipAddress }}</div>
    </header>
    <main class="chat-main">
      <div class="chat-sidebar">
        <h3><i class="fas fa-comments"></i> Room Code:</h3>
        <h2>{{ roomCode }}</h2>
        <h3><i class="fas fa-users"></i> Users</h3>
        <ul>
          <li v-for="user in users" :key="user.id">{{ user.username }}</li>
        </ul>
      </div>
      <div class="chat-messages">
        <div v-for="message in messages" :key="message.time" class="message">
          <p class="meta">{{ message.username }} <span>{{ message.time }}</span></p>
          <p class="text">{{ message.text }}</p>
        </div>
      </div>
    </main>
    <div class="chat-form-container">
      <form @submit.prevent="sendMessage">
        <input v-model="message" type="text" placeholder="Enter Message" required autocomplete="off" />
        <button class="btn"><i class="fas fa-paper-plane"></i> Send</button>
      </form>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      message: '',
      messages: [],
      users: [],
      roomName: '',
      ipAddress: '',
      roomCode: ''
    };
  },
  created() {
    const { username, room, roomName, roomCode } = this.$route.query;
    this.roomName = roomName || room; // Fallback to room code if roomName is not provided
    this.roomCode = roomCode || room;
    this.socket = io();

    this.socket.emit('joinRoom', { username, room });

    this.socket.on('roomData', ({ roomName, roomCode }) => {
      this.roomName = roomName;
      this.roomCode = roomCode;
    });

    this.socket.on('roomUsers', ({ room, users }) => {
      this.users = users;
    });

    this.socket.on('message', (message) => {
      this.messages.push(message);
      this.scrollToBottom();
    });

    this.socket.on('ipAddress', (ip) => {
      this.ipAddress = ip;
    });
  },
  methods: {
    sendMessage() {
      if (this.message.trim()) {
        this.socket.emit('chatMessage', this.message);
        this.message = '';
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const chatMessages = this.$el.querySelector('.chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    },
    leaveRoom() {
      if (this.socket) {
        this.socket.emit('leaveRoom');
        this.socket.disconnect();
      }
      this.$router.push('/');
    }
  }
};
</script>

