<template>
  <div class="join-container">
    <header class="join-header">
      <h1>Chat</h1>
    </header>
    <main class="join-main">
      <form @submit.prevent="joinChat">
        <div class="form-control">
          <label for="username">Username</label>
          <input type="text" v-model="username" placeholder="Enter username..." required />
        </div>
        <div class="form-control">
          <label for="room">Room</label>
          <select v-model="room">
            <option value="Helpdesk 1">Helpdesk 1</option>
            <option value="Helpdesk 2">Helpdesk 2</option>
          </select>
        </div>
        <button type="submit" class="btn">Join Chat</button>
      </form>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      room: 'Helpdesk 1',
    };
  },
  methods: {
    joinChat() {
      this.$router.push({ name: 'Chat', query: { username: this.username, room: this.room } });
    },
  },
};
</script>


