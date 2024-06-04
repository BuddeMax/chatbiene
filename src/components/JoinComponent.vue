<template>
  <div class="join-container">
    <header class="join-header">
      <h1>Chat</h1>
    </header>
    <main class="join-main">
      <div v-if="step === 1">
        <form @submit.prevent="proceedToNextStep">
          <div class="form-control">
            <label for="username">Username</label>
            <input type="text" v-model="username" placeholder="Enter username..." required />
          </div>
          <div class="form-control">
            <label for="action">Action</label>
            <select v-model="action">
              <option value="create">Create Room</option>
              <option value="join">Join Room</option>
            </select>
          </div>
          <button type="submit" class="btn">Next</button>
        </form>
      </div>
      <div v-else-if="step === 2 && action === 'create'">
        <form @submit.prevent="createRoom">
          <div class="form-control">
            <label for="roomName">Room Name</label>
            <input type="text" v-model="roomName" placeholder="Enter room name..." required />
          </div>
          <button type="submit" class="btn">Create Room</button>
        </form>
      </div>
      <div v-else-if="step === 2 && action === 'join'">
        <form @submit.prevent="joinRoom">
          <div class="form-control">
            <label for="roomCode">Room Code</label>
            <input type="text" v-model="roomCode" placeholder="Enter room code..." required />
          </div>
          <button type="submit" class="btn">Join Room</button>
        </form>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      step: 1,
      username: '',
      action: 'create',
      roomName: '',
      roomCode: ''
    };
  },
  methods: {
    proceedToNextStep() {
      this.step = 2;
    },
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
    }
  }
};
</script>



