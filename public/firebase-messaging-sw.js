// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDZd0yUcPS137riDA05bglI3aVicoCq77M",
    authDomain: "acomodate-muebles.firebaseapp.com",
    projectId: "acomodate-muebles",
    storageBucket: "acomodate-muebles.firebasestorage.app",
    messagingSenderId: "739987602622",
    appId: "1:739987602622:web:c3d3a21b9afdab936532ef",
    measurementId: "G-X8RWZ68E2S"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Recibir notificaciones cuando la pestaña está cerrada o en segundo plano
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || '¡Nuevo Pedido en Decoespejos!';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // asegúrate de tener una imagen en public/icon.png
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});