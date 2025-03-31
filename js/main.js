// js/main.js
import { createApp } from 'vue';
import App from './App.js'; // Import the root component

console.log("Mounting Vue app...");

const app = createApp(App);

// Mount the app to the #app element in index.html
app.mount('#app');
