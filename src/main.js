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

// Entferne die Registrierung des Service-Workers, wenn du ihn nicht benötigst
// if ('serviceWorker' in navigator) {
// navigator.serviceWorker.register('/service-worker.js')
// .then(registration => {
// console.log('Service Worker registered with scope:', registration.scope);
// })
// .catch(error => {
// console.log('Service Worker registration failed:', error);
// });
// }

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

// Überprüfen Sie, ob der Browser Service Workers und die Push API unterstützt
if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');


// Registrieren Sie den Service Worker
    navigator.serviceWorker.register('service-worker.js')
        .then(function(swReg) {
            console.log('Service Worker is registered', swReg);

            // Initialisieren Sie eine Variable für den Service Worker Registration
            let serviceWorkerRegistration = swReg;

            // Fragen Sie den Benutzer um Erlaubnis für Push-Benachrichtigungen
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    // Wenn die Erlaubnis erteilt wurde, abonnieren Sie den Benutzer für Push-Benachrichtigungen
                    serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true })
                        .then(function(subscription) {
                            console.log('User is subscribed:', subscription);
                        })
                        .catch(function(error) {
                            console.error('Failed to subscribe the user: ', error);
                        });
                }
            });
        })
        .catch(function(error) {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
}
