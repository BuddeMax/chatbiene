<template>
  <div class="chat-container" v-touch:swipe.left="showQRCode" v-touch:swipe.right="hideQRCode">
    <header class="chat-header">
      <div class="room-info">
        <p><strong>Raum-Name:</strong> {{ roomName }}</p>
        <p><strong>Raum-Code:</strong> {{ roomCode }}</p>
      </div>
      <div class="button-container">
        <button @click="leaveRoom" class="btn">Raum verlassen</button>
        <button class="btn show-qr-desktop" @click="showQRCode">QR-Code anzeigen</button>
      </div>
    </header>
    <main class="chat-main">
      <div class="chat-sidebar">
        <h3><i class="fas fa-users"></i> Users</h3>
        <ul>
          <li v-for="user in users" :key="user.id">{{ user.username }}</li>
        </ul>
      </div>
      <div class="chat-content">
        <div class="tabs">
          <button @click="activeTab = 'chat'" :class="{ active: activeTab === 'chat' }">Chat</button>
          <button @click="activeTab = 'questions'" :class="{ active: activeTab === 'questions' }">Fragen</button>
        </div>
        <div v-if="activeTab === 'chat'" class="chat-messages">
          <div v-for="message in messages" :key="message.time" :class="['message', { 'sent': message.username === username, 'received': message.username !== username }]">
            <p class="meta">{{ message.username }} <span>{{ message.time }}</span></p>
            <p class="text">{{ decryptMessage(message.text) }}</p>
          </div>
        </div>
        <div v-if="activeTab === 'questions'" class="chat-questions">
          <div v-for="question in questions" :key="question.time" :class="['message', { 'sent': question.username === username, 'received': question.username !== username }]">
            <p class="meta">{{ question.username }} <span>{{ question.time }}</span></p>
            <p class="text">{{ decryptMessage(question.text) }}</p>
          </div>
        </div>
      </div>
    </main>
    <div class="chat-form-container">
      <form @submit.prevent="sendMessageOrQuestion">
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
      questions: [], // Add questions array
      users: [],
      roomName: '',
      ipAddress: '',
      roomCode: '',
      username: '',
      showModal: false,
      encryptionKey: 'ffdedd009668c3679b85433cc4c99d87194f27a484abbc56fd970188053e3fa5', // Replace with a secure key
      activeTab: 'chat' // Add activeTab state
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

    this.socket.on('question', (question) => { // Listen for questions
      this.questions.push(question);
      if (question.username !== 'ChatCord Bot') {
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
    sendMessageOrQuestion() {
      if (this.message.trim()) {
        const encryptedMessage = this.encryptMessage(this.message);
        if (this.activeTab === 'chat') {
          this.socket.emit('chatMessage', { text: encryptedMessage, sender: this.username });
        } else if (this.activeTab === 'questions') {
          this.socket.emit('question', { text: encryptedMessage, sender: this.username });
        }
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
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        const chatQuestions = this.$el.querySelector('.chat-questions');
        if (chatQuestions) {
          chatQuestions.scrollTop = chatQuestions.scrollHeight;
        }
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
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 900px;
  background: #fff;
  box-shadow: var(--box-shadow);
  overflow: hidden;
}

.chat-header {
  background: var(--primary-color);
  color: #fff;
  padding: var(--padding);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.chat-main {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.chat-sidebar {
  width: 250px;
  background: #fff;
  padding: var(--padding);
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-grow: 1;
  overflow: hidden;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
  background: var(--primary-color);
}

.tabs button {
  padding: 10px;
  border: none;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: background 0.3s;
  flex: 1;
}

.tabs button.active {
  background-color: #0056b3;
}

.chat-messages,
.chat-questions {
  flex-grow: 1;
  padding: var(--padding);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.message {
  padding: var(--padding);
  margin-bottom: 10px;
  background-color: #f1f1f1; /* Hintergrundfarbe für alle Nachrichten */
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  max-width: 70%;
  word-wrap: break-word;
}

.chat-messages .message.sent {
  background-color: #e0e0e0 !important; /* Grau für gesendete Nachrichten */
  color: #000 !important; /* Schwarz für Text in gesendeten Nachrichten */
  align-self: flex-end;
  margin-left: auto; /* Sicherstellen, dass es rechtsbündig ist */
}

.message.received {
  background-color: #f1f1f1; /* Hintergrundfarbe für empfangene Nachrichten */
  color: #000; /* Textfarbe für empfangene Nachrichten */
  align-self: flex-start;
  margin-right: auto; /* Sicherstellen, dass es linksbündig ist */
}

.message .meta {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
  margin-bottom: 5px;
}

.chat-form-container {
  padding: var(--padding);
  background-color: var(--background-color);
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
}

.chat-form-container form {
  display: flex;
  width: 100%;
}

.chat-form-container input[type='text'] {
  font-size: 16px;
  padding: var(--padding);
  height: 40px;
  flex-grow: 1;
  border-radius: var(--border-radius);
  border: 1px solid #ddd;
  margin-right: var(--padding);
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

.qr-code {
  display: block;
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

/* Hide the QR code button on mobile */
.show-qr-desktop {
  display: none;
}

/* Show the QR code button on desktop */
@media (min-width: 768px) {
  .show-qr-desktop {
    display: inline-block;
  }

  .button-container {
    flex-direction: row;
    gap: 20px;
  }
}
</style>
