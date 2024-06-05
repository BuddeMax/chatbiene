import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/saga-blue/theme.css'; // Theme
import 'primevue/resources/primevue.min.css'; // Core CSS
import 'primeicons/primeicons.css'; // Icons
import JoinComponent from './components/JoinComponent.vue';
import ChatComponent from './components/ChatComponent.vue';
import AdminComponent from './components/AdminComponent.vue';
import './assets/style.css'; // Importiere die CSS-Datei

// Komponenten
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

Vue.config.productionTip = false;

Vue.use(VueRouter);
Vue.use(PrimeVue);

Vue.component('Button', Button);
Vue.component('InputText', InputText);
Vue.component('Message', Message);

const routes = [
    { path: '/', component: JoinComponent },
    { path: '/chat', name: 'Chat', component: ChatComponent },
    { path: '/admin', name: 'Admin', component: AdminComponent },
];

const router = new VueRouter({
    mode: 'history',
    routes,
});

new Vue({
    render: (h) => h(App),
    router,
}).$mount('#app');


