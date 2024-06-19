<template>
  <div class="chat-container">
    <header class="chat-header">
      <h1>Chat Room: {{ roomName }}</h1>
      <button @click="leaveRoom" class="btn">Leave Room</button>
      <div class="server-ip">Server IP: {{ ipAddress }}:8080</div>
      <canvas ref="qrCanvas" class="qr-code"></canvas> <!-- QR-Code Canvas -->
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
import QRCode from 'qrcode';

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
      username: '', // Benutzername hinzufügen
    };
  },
  created() {
    const { username, room, roomName, roomCode } = this.$route.query;
    this.roomName = roomName || room; // Fallback to room code if roomName is not provided
    this.roomCode = roomCode || room;
    this.username = username; // Benutzername setzen
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
      console.log('New message received:', message); // Debugging
      this.messages.push(message);

      // Überprüfen, ob die Nachricht nicht vom Bot und nicht vom aktuellen Benutzer stammt
      if (message.username !== 'ChatCord Bot' && message.username !== this.username) {
        this.showNotification(message.username, { body: message.text });
      }

      this.scrollToBottom();
    });

    this.socket.on('pushNotification', (notification) => {
      // Überprüfen, ob die Benachrichtigung nicht vom aktuellen Benutzer stammt
      if (notification.title !== `Message from ${this.username}`) {
        // Send notification to Service Worker
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.ready.then(function(swReg) {
            swReg.showNotification(notification.title, {
              body: notification.body,
              tag: 'chat-message',
              renotify: true
            });
          });
        }
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
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function (permission) {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          } else {
            console.log('Notification permission denied.');
          }
        });
      }
    },
    showNotification(title, options) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
        notification.onclick = function (event) {
          event.preventDefault(); // Prevent the browser from focusing the Notification's tab
          window.focus();
        };
      } else {
        console.log('Notification permission not granted.');
      }
    }
  },
  mounted() {
    this.askNotificationPermission();
  }
};
</script>
