import { createApp } from 'vue'
import './registerServiceWorker'
import './style.css'
import App from './App.vue'

if ('serviceWorker' in navigator) {
   navigator.serviceWorker.register("/serviceworker.js", { scope: "/" })
    .then(registration => {;
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    })
    .catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });

}

createApp(App).mount('#app')
