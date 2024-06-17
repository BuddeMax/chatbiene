<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="checkPassword">
      <label for="password">Password:</label>
      <input type="password" v-model="password" id="password" required>
      <button type="submit">Login</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      password: '',
      error: ''
    };
  },
  methods: {
    checkPassword() {
      const correctPassword = 'yourpassword'; // Set your password here
      if (this.password === correctPassword) {
        localStorage.setItem('authenticatedForChatbiene', true);
        this.$router.push('/admin');
      } else {
        this.error = 'Incorrect password';
      }
    }
  }
};
</script>



