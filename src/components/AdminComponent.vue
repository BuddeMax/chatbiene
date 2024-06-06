<template>
  <div v-if="authenticated" class="admin-container">
    <header class="admin-header">
      <h1>Admin Dashboard</h1>
      <nav>
        <button class="btn-third" @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">Users & Rooms</button>
        <button class="btn-third" @click="activeTab = 'colors'" :class="{ active: activeTab === 'colors' }">Colors</button>
        <button class="btn-third" @click="goHome">Back to Home</button>
      </nav>
    </header>
    <main class="admin-main">
      <section v-if="activeTab === 'users'">
        <h2>Active Rooms</h2>
        <ul>
          <li v-for="room in rooms" :key="room.code">
            {{ room.name }} (Code: {{ room.code }})
            <button @click="closeRoom(room.code)" class="btn-close">Close Room</button>
          </li>
        </ul>
        <h2>Online Users</h2>
        <ul>
          <li v-for="user in users" :key="user.id">
            {{ user.username }} (Room: {{ user.room }})
            <button @click="removeUser(user.id)" class="btn-remove">Remove User</button>
          </li>
        </ul>
      </section>
      <section v-if="activeTab === 'colors'">
        <h2>Change Colors</h2>
        <div class="color-picker">
          <label for="primary-color">Primary Color:</label>
          <input type="color" id="primary-color" v-model="colors.primaryColor" @input="updateColors" />
        </div>
        <div class="color-picker">
          <label for="secondary-color">Secondary Color:</label>
          <input type="color" id="secondary-color" v-model="colors.secondaryColor" @input="updateColors" />
        </div>
        <div class="color-picker">
          <label for="background-color">Background Color:</label>
          <input type="color" id="background-color" v-model="colors.backgroundColor" @input="updateColors" />
        </div>
        <div class="color-picker">
          <label for="text-color">Text Color:</label>
          <input type="color" id="text-color" v-model="colors.textColor" @input="updateColors" />
        </div>
        <div class="color-picker">
          <label for="btn-background-color">Button Background Color:</label>
          <input type="color" id="btn-background-color" v-model="colors.btnBackgroundColor" @input="updateColors" />
        </div>
        <div class="color-picker">
          <label for="btn-hover-color">Button Hover Color:</label>
          <input type="color" id="btn-hover-color" v-model="colors.btnHoverColor" @input="updateColors" />
        </div>
        <button class="btn-send-colors" @click="sendColors">Send Colors to All Users</button>
      </section>
    </main>
  </div>
  <div v-else>
    <p>You are not authorized to view this page.</p>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      rooms: [],
      users: [],
      authenticated: false,
      activeTab: 'users',
      colors: {
        primaryColor: '#333',
        secondaryColor: '#555',
        backgroundColor: '#f9f9f9',
        textColor: '#fff',
        btnBackgroundColor: '#333',
        btnHoverColor: '#555',
      }
    };
  },
  created() {
    this.checkAuthentication();
    this.fetchAdminData();
    this.loadColors();
    this.socket = io();
  },
  methods: {
    checkAuthentication() {
      this.authenticated = localStorage.getItem('authenticated') === 'true';
    },
    async fetchAdminData() {
      if (this.authenticated) {
        try {
          const response = await fetch('/api/admin-data');
          if (!response.ok) {
            throw new Error('Error fetching admin data');
          }
          const data = await response.json();
          this.rooms = data.rooms;
          this.users = data.users;
        } catch (error) {
          console.error(error);
        }
      }
    },
    async closeRoom(roomCode) {
      try {
        const response = await fetch('/api/close-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ roomCode })
        });
        if (!response.ok) {
          throw new Error('Error closing room');
        }
        this.fetchAdminData(); // Refresh the data after closing the room
      } catch (error) {
        console.error(error);
      }
    },
    async removeUser(userId) {
      try {
        const response = await fetch('/api/remove-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        if (!response.ok) {
          throw new Error('Error removing user');
        }
        this.fetchAdminData(); // Refresh the data after removing the user
      } catch (error) {
        console.error(error);
      }
    },
    updateColors() {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', this.colors.primaryColor);
      root.style.setProperty('--secondary-color', this.colors.secondaryColor);
      root.style.setProperty('--background-color', this.colors.backgroundColor);
      root.style.setProperty('--text-color', this.colors.textColor);
      root.style.setProperty('--btn-background-color', this.colors.btnBackgroundColor);
      root.style.setProperty('--btn-hover-color', this.colors.btnHoverColor);
      localStorage.setItem('colors', JSON.stringify(this.colors));
    },
    sendColors() {
      this.updateColors();
      this.socket.emit('updateColors', this.colors); // Senden Sie die Farben an alle Clients
    },
    loadColors() {
      const savedColors = localStorage.getItem('colors');
      if (savedColors) {
        this.colors = JSON.parse(savedColors);
        this.updateColors(); // Apply the saved colors
      }
    },
    goHome() {
      this.$router.push('/');
    }
  }
};
</script>




