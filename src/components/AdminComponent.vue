<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>Admin Dashboard</h1>
    </header>
    <main class="admin-main">
      <section>
        <h2>Active Rooms</h2>
        <ul>
          <li v-for="room in rooms" :key="room.code">{{ room.name }} (Code: {{ room.code }})</li>
        </ul>
      </section>
      <section>
        <h2>Online Users</h2>
        <ul>
          <li v-for="user in users" :key="user.id">{{ user.username }} (Room: {{ user.room }})</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rooms: [],
      users: []
    };
  },
  created() {
    this.fetchAdminData();
  },
  methods: {
    async fetchAdminData() {
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
  }
};
</script>

