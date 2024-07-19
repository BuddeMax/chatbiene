<template>
  <div class="chat-container" v-touch:swipe.left="showQRCode" v-touch:swipe.right="hideQRCode">
    <header class="chat-header">
      <p>Chat Room: {{ roomName }}</p>
      <button @click="leaveRoom" class="btn">Leave Room</button>
      <button class="btn show-qr-desktop" @click="showQRCode">Show QR Code</button>
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
        <div v-for="message in messages" :key="message.time" :class="['message', { 'my-message': message.username === username }]">
          <p class="meta">{{ message.username }} <span>{{ message.time }}</span></p>
          <p class="text">{{ decryptMessage(message.text) }}</p>
        </div>
      </div>
    </main>
    <div class="chat-form-container">
      <form @submit.prevent="sendMessage">
        <input v-model="message" type="text" placeholder="Enter Message" required autocomplete="off" />
        <button class="btn"><i class="fas fa-paper-plane"></i> Send</button>
      </form>
    </div>

    <!-- Modal for QR Code -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="hideQRCode">&times;</span>
        <div class="qr-code-container">
          <canvas ref="qrCanvas" class="qr-code"></canvas>
          <p>Server IP: {{ ipAddress }}:8080</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import Vue2TouchEvents from 'vue2-touch-events';

export default {
  data() {
    return {
      socket: null,
      message: '',
      messages: [],
      users: [],
      roomName: '',
      ipAddress: '',
      roomCode: '',
      username: '',
      showModal: false,
      encryptionKey: 'ffdedd009668c3679b85433cc4c99d87194f27a484abbc56fd970188053e3fa5' // Replace with a secure key
    };
  },
  created() {
    const { username, room, roomName, roomCode } = this.$route.query;
    this.roomName = roomName || room;
    this.roomCode = roomCode || room;
    this.username = username;
    this.socket = io();

    this.socket.emit('joinRoom', { username, room });

    this.socket.on('roomData', ({ roomName, roomCode }) => {
      this.roomName = roomName;
      this.roomCode = roomCode;
      this.generateQRCode();
    });

    this.socket.on('roomUsers', ({ room, users }) => {
      this.users = users;
    });

    this.socket.on('message', (message) => {
      this.messages.push(message);
      if (message.username !== 'ChatCord Bot') {
        this.scrollToBottom();
      }
    });

    this.socket.on('pushNotification', (notification) => {
      if (notification.sender !== this.username) {
        this.showNotification(notification.title, { body: notification.body });
      }
    });

    this.socket.on('ipAddress', (ip) => {
      this.ipAddress = ip;
      this.generateQRCode();
    });

    this.socket.on('roomClosed', () => {
      alert('This room has been closed by the admin.');
      this.leaveRoom();
    });

    this.socket.on('userRemoved', () => {
      alert('You have been removed from the room by the admin.');
      this.leaveRoom();
    });

    this.askNotificationPermission(); // Ask for notification permission on created
  },
  methods: {
    sendMessage() {
      if (this.message.trim()) {
        const encryptedMessage = this.encryptMessage(this.message);
        this.socket.emit('chatMessage', { text: encryptedMessage, sender: this.username });
        this.message = '';
      }
    },
    encryptMessage(message) {
      return CryptoJS.AES.encrypt(message, this.encryptionKey).toString();
    },
    decryptMessage(cipherText) {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
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
        this.socket.close();
      }
      this.$router.push('/');
    },
    generateQRCode() {
      if (this.ipAddress && this.roomCode) {
        const url = `http://${this.ipAddress}:8080/?roomCode=${this.roomCode}`;
        QRCode.toCanvas(this.$refs.qrCanvas, url, { width: 128, height: 128 }, (error) => {
          if (error) console.error(error);
        });
      }
    },
    askNotificationPermission() {
      if (!('Notification' in window)) {
        console.error('This browser does not support desktop notification');
        alert('This browser does not support desktop notification');
        this.socket.emit('notificationSupport', { notificationSupported: false });
      } else if (Notification.permission === 'granted') {
        console.log('Notification permission granted.');
        this.socket.emit('notificationSupport', { notificationSupported: true });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            this.socket.emit('notificationSupport', { notificationSupported: true });
          } else {
            console.log('Notification permission denied.');
            this.socket.emit('notificationSupport', { notificationSupported: false });
          }
        });
      } else {
        this.socket.emit('notificationSupport', { notificationSupported: false });
      }
    },
    showNotification(title, options) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
        notification.onclick = function (event) {
          event.preventDefault();
          window.focus();
        };
      } else {
        console.log('Notification permission not granted.');
      }
    },
    showQRCode() {
      this.showModal = true;
      this.$nextTick(() => {
        this.generateQRCode();
      });
    },
    hideQRCode() {
      this.showModal = false;
    }
  }
};
</script>

<style>
.qr-code {
  display: block;
}

.modal {
  display: flex;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fefefe;
  margin: auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  max-width: 300px;
  text-align: center;
  border-radius: var(--border-radius);
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.message {
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  background: #f4f4f4;
}

.my-message {
  background: #dcf8c6;
  margin-left: auto;
  text-align: right;
}

.meta {
  font-weight: bold;
}

.text {
  margin: 5px 0 0;
}

/* Hide the QR code button on mobile */
.show-qr-desktop {
  display: none;
}

/* Show the QR code button on desktop */
@media (min-width: 768px) {
  .show-qr-desktop {
    display: inline-block;
  }
}
</style>
