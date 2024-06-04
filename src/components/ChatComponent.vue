<template>
  <div class="chat-container">
    <header class="chat-header">
      <h1>Chat</h1>
      <router-link to="/" class="btn">Leave Room</router-link>
    </header>
    <main class="chat-main">
      <div class="chat-sidebar">
        <h3><i class="fas fa-comments"></i> Room Name:</h3>
        <h2>{{ roomName }}</h2>
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
        <InputText v-model="message" type="text" placeholder="Enter Message" required autocomplete="off" />
        <Button type="submit" icon="pi pi-send" class="p-button-success" />
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
    };
  },
  created() {
    const { username, room } = this.$route.query;
    this.socket = io();

    this.socket.emit('joinRoom', { username, room });

    this.socket.on('roomUsers', ({ room, users }) => {
      this.roomName = room;
      this.users = users;
    });

    this.socket.on('message', (message) => {
      this.messages.push(message);
      this.scrollToBottom();
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
  },
};
</script>

<style scoped>
/* Hier können spezifische Stile für diese Komponente definiert werden */
</style>


