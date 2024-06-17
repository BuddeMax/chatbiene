import { createRouter, createWebHistory } from 'vue-router';
import JoinComponent from '../components/JoinComponent.vue';
import ChatComponent from '../components/ChatComponent.vue';
import AdminComponent from '../components/AdminComponent.vue';
import LoginComponent from "@/components/LoginComponent.vue";

const routes = [
  {
    path: '/',
    name: 'Join',
    component: JoinComponent
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatComponent
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (localStorage.getItem('authenticatedForChatbiene') === 'true') {
        next();
      } else {
        next('/login');
      }
    }
  },
  {
    path: '*',
    redirect: '/login'
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
