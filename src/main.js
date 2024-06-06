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
import LoginComponent from "@/components/LoginComponent.vue";
import './assets/style.css'; // Importiere die CSS-Datei
import io from 'socket.io-client';


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
    { path: '/login', name: 'Login', component: LoginComponent },
    { path: '*', redirect: '/' },
];

const router = new VueRouter({
    mode: 'history',
    routes,
});

const socket = io();

socket.on('colorsUpdated', (colors) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primaryColor);
    root.style.setProperty('--secondary-color', colors.secondaryColor);
    root.style.setProperty('--background-color', colors.backgroundColor);
    root.style.setProperty('--text-color', colors.textColor);
    root.style.setProperty('--btn-background-color', colors.btnBackgroundColor);
    root.style.setProperty('--btn-hover-color', colors.btnHoverColor);
    localStorage.setItem('colors', JSON.stringify(colors));
});

new Vue({
    render: (h) => h(App),
    router,
    mounted() {
        const savedColors = localStorage.getItem('colors');
        if (savedColors) {
            const colors = JSON.parse(savedColors);
            const root = document.documentElement;
            root.style.setProperty('--primary-color', colors.primaryColor);
            root.style.setProperty('--secondary-color', colors.secondaryColor);
            root.style.setProperty('--background-color', colors.backgroundColor);
            root.style.setProperty('--text-color', colors.textColor);
            root.style.setProperty('--btn-background-color', colors.btnBackgroundColor);
            root.style.setProperty('--btn-hover-color', colors.btnHoverColor);
        }
    }
}).$mount('#app');


