import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocialAuthUrl, fetchSocialAccounts } from '../services/api';

export default function useConnectSocial() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const popupRef = useRef(null);
  const pollRef = useRef(null);

  const refreshAccounts = useCallback(async () => {
    try {
      const { accounts: list } = await fetchSocialAccounts();
      setAccounts(list);
    } catch (err) {
      console.error('[Social] Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const connect = useCallback(async (platform, connectionType) => {
    setConnecting(true);
    setConnectingPlatform(platform);

    try {
      const { auth_url } = await getSocialAuthUrl(platform, connectionType);

      const popup = window.open(
        auth_url,
        'rayna-connect-social',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      popupRef.current = popup;

      return new Promise((resolve) => {
        const onMessage = (event) => {
          if (event.data?.type !== 'SOCIAL_ACCOUNT_CONNECTED') return;

          window.removeEventListener('message', onMessage);
          if (pollRef.current) clearInterval(pollRef.current);
          setConnecting(false);
          setConnectingPlatform(null);

          if (event.data.success) {
            refreshAccounts();
            resolve({
              success: true,
              usernames: event.data.usernames || [],
              platform: event.data.platform || platform,
            });
          } else {
            resolve({
              success: false,
              error: event.data.error || 'Connection failed',
              platform: event.data.platform || platform,
            });
          }
        };

        window.addEventListener('message', onMessage);

        // Detect manual popup close
        pollRef.current = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollRef.current);
            window.removeEventListener('message', onMessage);
            setConnecting(false);
            setConnectingPlatform(null);
            refreshAccounts();
            resolve({ success: false, error: 'popup_closed', platform });
          }
        }, 1000);
      });
    } catch (err) {
      setConnecting(false);
      setConnectingPlatform(null);
      return { success: false, error: err.message, platform };
    }
  }, [refreshAccounts]);

  return { accounts, loading, connecting, connectingPlatform, connect, refreshAccounts };
}
