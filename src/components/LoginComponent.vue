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
    async checkPassword() {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: this.password })
        });

        const result = await response.json();

        if (result.success) {
          localStorage.setItem('authenticatedForChatbiene', true);
          this.$router.push('/admin');
        } else {
          this.error = 'Incorrect password';
        }
      } catch (error) {
        console.error('Error during login:', error);
        this.error = 'An error occurred. Please try again later.';
      }
    }
  }
};
</script>
