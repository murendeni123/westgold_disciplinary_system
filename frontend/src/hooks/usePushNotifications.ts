import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      fetchPublicKey();
      checkSubscription();
    }
  }, [user]);

  const fetchPublicKey = async () => {
    try {
      const response = await api.getPushPublicKey();
      setPublicKey(response.data.publicKey);
    } catch (error) {
      console.error('Error fetching public key:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    if (!publicKey || !isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      await api.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
          ),
        },
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await api.unsubscribePush(subscription.endpoint);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};

