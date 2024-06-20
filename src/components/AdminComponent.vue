<template>
  <div v-if="authenticated" class="admin-container">
    <header class="admin-header">
      <h1>Admin Dashboard</h1>
      <nav>
        <button class="btn-secondary" @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">Users & Rooms</button>
        <button class="btn-secondary" @click="activeTab = 'colors'" :class="{ active: activeTab === 'colors' }">Colors</button>
        <button class="btn-secondary" @click="activeTab = 'statistics'" :class="{ active: activeTab === 'statistics' }">Statistics</button>
        <button class="btn-secondary" @click="goHome">Back to Home</button>
      </nav>
    </header>
    <main class="admin-main">
      <section v-if="activeTab === 'users'">
        <h2>Active Rooms</h2>
        <div class="grid-container">
          <div class="grid-item" v-for="room in rooms" :key="room.code">
            <p>{{ room.name }} (Code: {{ room.code }})</p>
            <button @click="closeRoom(room.code)" class="btn">Close Room</button>
            <button @click="downloadCsv(room.code)" class="btn">Download CSV</button>
          </div>
        </div>
        <h2>Online Users</h2>
        <div class="grid-container">
          <div class="grid-item" v-for="user in users" :key="user.id">
            <p>{{ user.username }} (Room: {{ user.room }})</p>
            <button @click="removeUser(user.id)" class="btn">Remove User</button>
          </div>
        </div>
      </section>
      <section v-if="activeTab === 'colors'">
        <h2>Change Colors</h2>
        <div class="grid-container">
          <div class="grid-item">
            <label for="primary-color">Primary Color:</label>
            <input type="color" id="primary-color" v-model="colors.primaryColor" @input="updateColors" />
          </div>
          <div class="grid-item">
            <label for="secondary-color">Secondary Color:</label>
            <input type="color" id="secondary-color" v-model="colors.secondaryColor" @input="updateColors" />
          </div>
          <div class="grid-item">
            <label for="background-color">Background Color:</label>
            <input type="color" id="background-color" v-model="colors.backgroundColor" @input="updateColors" />
          </div>
          <div class="grid-item">
            <label for="text-color">Text Color:</label>
            <input type="color" id="text-color" v-model="colors.textColor" @input="updateColors" />
          </div>
          <div class="grid-item full-width">
            <button class="btn" @click="sendColors">Send Colors to All Users</button>
          </div>
        </div>
      </section>
      <section v-if="activeTab === 'statistics'">
        <h2>Statistics</h2>
        <div class="chart-container">
          <canvas id="userChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="roomChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="messageChart"></canvas>
        </div>
      </section>
    </main>
  </div>
  <div v-else>
    <p>You are not authorized to view this page.</p>
  </div>
</template>

<script>
import io from 'socket.io-client';
import Chart from 'chart.js/auto';

export default {
  data() {
    return {
      socket: null,
      rooms: [],
      users: [],
      messages: [],
      authenticated: false,
      activeTab: 'users',
      colors: {
        primaryColor: '#001c30',
        secondaryColor: '#a3d2ca',
        backgroundColor: '#f4f4f9',
        textColor: '#2b2d42'
      },
      userCountMap: new Map(),
      roomCountMap: new Map(),
      messageCountMap: new Map(),
      userChart: null,
      roomChart: null,
      messageChart: null,
    };
  },
  created() {
    this.checkAuthentication();
    this.fetchAdminData();
    this.fetchStatistics();
    this.loadColors();
    this.socket = io();
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'statistics') {
        this.$nextTick(() => {
          this.renderCharts();
        });
      }
    }
  },
  methods: {
    checkAuthentication() {
      this.authenticated = localStorage.getItem('authenticatedForChatbiene') === 'true';
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
    async fetchStatistics() {
      if (this.authenticated) {
        try {
          const response = await fetch('/api/statistics');
          if (!response.ok) {
            throw new Error('Error fetching statistics');
          }
          const data = await response.json();
          console.log('Fetched Statistics:', data);
          this.userCountMap = new Map(data.userCountMap);
          this.roomCountMap = new Map(data.roomCountMap);
          this.messageCountMap = new Map(data.messageCountMap);
          console.log('User Count Map:', this.userCountMap);
          console.log('Room Count Map:', this.roomCountMap);
          console.log('Message Count Map:', this.messageCountMap);
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
      localStorage.setItem('colors', JSON.stringify(this.colors));
    },
    sendColors() {
      this.updateColors();
      this.socket.emit('updateColors', this.colors); // Send colors to all clients
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
    },
    downloadCsv(roomCode) {
      const url = `/api/download-csv/${roomCode}`;
      window.open(url, '_blank');
    },
    renderCharts() {
      const userCanvas = document.getElementById('userChart');
      const roomCanvas = document.getElementById('roomChart');
      const messageCanvas = document.getElementById('messageChart');

      if (userCanvas && roomCanvas && messageCanvas) {
        const ctxUser = userCanvas.getContext('2d');
        const ctxRoom = roomCanvas.getContext('2d');
        const ctxMessage = messageCanvas.getContext('2d');

        // Render User Chart
        const userChartData = {
          labels: Array.from(this.userCountMap.keys()),
          datasets: [{
            label: 'User Count',
            data: Array.from(this.userCountMap.values()),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        };
        if (this.userChart) {
          this.userChart.data = userChartData;
          this.userChart.update();
        } else {
          this.userChart = new Chart(ctxUser, {
            type: 'line',
            data: userChartData
          });
        }

        // Render Room Chart
        const roomChartData = {
          labels: Array.from(this.roomCountMap.keys()),
          datasets: [{
            label: 'Room Count',
            data: Array.from(this.roomCountMap.values()),
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }]
        };
        if (this.roomChart) {
          this.roomChart.data = roomChartData;
          this.roomChart.update();
        } else {
          this.roomChart = new Chart(ctxRoom, {
            type: 'line',
            data: roomChartData
          });
        }

        // Render Message Chart
        const messageChartData = {
          labels: Array.from(this.messageCountMap.keys()),
          datasets: [{
            label: 'Message Count',
            data: Array.from(this.messageCountMap.values()),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        };
        if (this.messageChart) {
          this.messageChart.data = messageChartData;
          this.messageChart.update();
        } else {
          this.messageChart = new Chart(ctxMessage, {
            type: 'line',
            data: messageChartData
          });
        }
      } else {
        console.error('One or more chart canvas elements are not found.');
      }
    }
  }
};
</script>


