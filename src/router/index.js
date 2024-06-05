import { createRouter, createWebHistory } from 'vue-router';
import JoinComponent from '../components/JoinComponent.vue';
import ChatComponent from '../components/ChatComponent.vue';
import AdminComponent from '../components/AdminComponent.vue';

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
    path: '/admin',
    name: 'Admin',
    component: AdminComponent
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;



