// app/lib/usePushNotifications.ts (o src/lib/usePushNotifications.ts)
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = 'BIn4dOjdDo6q50ghb2AaCyLfmXk-ZGPAnAcXzWmonGNAlH4tirJNm0MiDcFNB-GC8PWi87ZSM9tFYyKGv4BKiZg';

export function usePushNotifications() {
  useEffect(() => {
    async function solicitarPermisos() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // 1. Registrar el Service Worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });

          // 2. 🛠️ Esperar a que el Service Worker esté activo y listo (Evita el error)
          await navigator.serviceWorker.ready;

          const messaging = getMessaging(app);

          // 3. Obtener token FCM pasando la registration lista
          const tokenActual = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (tokenActual) {
            // Guardar el token en Firestore bajo la colección 'admin_tokens'
            await setDoc(doc(db, 'admin_tokens', tokenActual), {
              token: tokenActual,
              actualizadoEn: new Date(),
              userAgent: navigator.userAgent
            });
            console.log('Token de notificación de Acomódate Muebles guardado:', tokenActual);
          }
        }
      } catch (error) {
        console.error('Error al configurar notificaciones Push en Acomódate Muebles:', error);
      }
    }

    solicitarPermisos();

    // Listener para notificaciones en primer plano
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title || 'Nuevo Pedido - Acomódate Muebles', {
            body: payload.notification.body,
            icon: '/icon.png'
          });
        }
      });
    }
  }, []);
}