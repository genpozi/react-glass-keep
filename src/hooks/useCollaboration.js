import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCollaboration Hook
 * Manages real-time collaboration via Server-Sent Events (SSE)
 * Handles connection, reconnection, polling fallback, and online/offline events
 */
export function useCollaboration({ token, tagFilter, onNotesUpdated }) {
  const [sseConnected, setSseConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const esRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_RECONNECT_DELAY = 1000;

  const connectSSE = useCallback(() => {
    if (!token) return;

    try {
      const url = new URL(`${window.location.origin}/api/events`);
      url.searchParams.set("token", token);
      url.searchParams.set("_t", Date.now()); // Cache buster for PWA
      
      const es = new EventSource(url.toString());

      es.onopen = () => {
        console.log("SSE connected");
        setSseConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data || '{}');
          if (msg && msg.type === 'note_updated') {
            if (onNotesUpdated) {
              onNotesUpdated();
            }
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      };

      es.addEventListener('note_updated', (e) => {
        try {
          const msg = JSON.parse(e.data || '{}');
          if (msg && msg.noteId && onNotesUpdated) {
            onNotesUpdated();
          }
        } catch (err) {
          console.error("Error parsing note_updated event:", err);
        }
      });

      es.onerror = (error) => {
        console.log("SSE error, attempting reconnect...", error);
        setSseConnected(false);

        // Check if SSE is in a failed state
        if (es.readyState === EventSource.CLOSED) {
          // If it's closed, check if token is still valid
          try {
            const auth = JSON.parse(localStorage.getItem('glass-keep-auth') || 'null');
            if (!auth || !auth.token) {
              console.log("SSE closed - no valid token, stopping reconnection");
              return;
            }
          } catch (err) {
            console.error("Error checking auth:", err);
            return;
          }
        }

        es.close();

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            
            // Check token before reconnecting
            try {
              const auth = JSON.parse(localStorage.getItem('glass-keep-auth') || 'null');
              if (!auth || !auth.token) {
                console.log("SSE reconnection cancelled - no valid token");
                return;
              }
            } catch (err) {
              console.error("Error checking auth:", err);
              return;
            }
            
            connectSSE();
          }, delay);
        } else {
          console.log("SSE reconnection attempts exhausted");
        }
      };

      esRef.current = es;
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      setSseConnected(false);
    }
  }, [token, onNotesUpdated]);

  const startPolling = useCallback(() => {
    pollIntervalRef.current = setInterval(() => {
      // Only poll if SSE is not connected
      if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
        if (onNotesUpdated) {
          onNotesUpdated();
        }
      }
    }, 30000); // Poll every 30 seconds as fallback
  }, [onNotesUpdated]);

  // Main SSE connection effect
  useEffect(() => {
    if (!token) return;

    connectSSE();

    // Start polling after a delay
    pollTimeoutRef.current = setTimeout(startPolling, 10000);

    return () => {
      setSseConnected(false);
      if (esRef.current) {
        esRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [token, connectSSE, startPolling]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, validate token first
        try {
          const auth = JSON.parse(localStorage.getItem('glass-keep-auth') || 'null');
          if (auth && auth.token) {
            // Token is valid, reconnect if needed
            if (esRef.current && esRef.current.readyState === EventSource.CLOSED) {
              connectSSE();
            }

            // Also refresh notes when page becomes visible
            if (onNotesUpdated) {
              onNotesUpdated();
            }
          }
        } catch (error) {
          console.error("Error handling visibility change:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectSSE, onNotesUpdated]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("App went online");
      setIsOnline(true);
      // Reconnect SSE if needed
      if (esRef.current && esRef.current.readyState === EventSource.CLOSED) {
        connectSSE();
      }
    };

    const handleOffline = () => {
      console.log("App went offline");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectSSE]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setSseConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connectSSE();
  }, [disconnect, connectSSE]);

  return {
    sseConnected,
    isOnline,
    disconnect,
    reconnect,
  };
}
