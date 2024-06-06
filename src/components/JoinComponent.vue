<template>
  <div class="join-container">
    <header class="join-header">
      <h1>Join Chat</h1>
    </header>
    <main class="join-main">
      <div v-if="action === 'join'">
        <form @submit.prevent="joinRoom">
          <div class="form-control">
            <label for="username">Username</label>
            <input type="text" v-model="username" placeholder="Enter username..." required />
          </div>
          <div class="form-control">
            <label for="roomCode">Room Code</label>
            <input type="text" v-model="roomCode" placeholder="Enter room code..." required />
          </div>
          <button type="submit" class="btn">Join Room</button>
          <button type="button" class="btn btn-secondary" @click="action = 'create'">Create New Room</button>
        </form>
      </div>
      <div v-else-if="action === 'create'">
        <form @submit.prevent="createRoom">
          <div class="form-control">
            <label for="roomName">Room Name</label>
            <input type="text" v-model="roomName" placeholder="Enter room name..." required />
          </div>
          <button type="submit" class="btn">Create Room</button>
          <button type="button" class="btn btn-secondary" @click="action = 'join'">Back to Join Room</button>
        </form>
      </div>
    </main>
    <button class="btn btn-admin" @click="goToAdmin">Admin Dashboard</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      action: 'join',
      roomName: '',
      roomCode: this.$route.query.roomCode || ''
    };
  },
  methods: {
    async createRoom() {
      try {
        const response = await fetch('/api/create-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ roomName: this.roomName })
        });
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Room created successfully:', data);
        this.$router.push({ name: 'Chat', query: { username: this.username, room: data.roomCode } });
      } catch (error) {
        console.error('Error creating room:', error);
      }
    },
    joinRoom() {
      this.$router.push({ name: 'Chat', query: { username: this.username, room: this.roomCode } });
    },
    goToAdmin() {
      this.$router.push({ name: 'Admin' });
    }
  }
};
</script>

<style scoped>
.admin-button {
  position: fixed;
  right: 0;
  bottom: 0;
}
</style>
