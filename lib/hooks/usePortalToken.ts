// hooks/usePortalToken.ts
'use client';

import { useState, useEffect } from 'react';

export function usePortalToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to get token with multiple fallbacks
    const getToken = () => {
      try {
        // Method 1: Direct localStorage
        let storedToken = localStorage.getItem('portal_token');
        
        // Method 2: window.localStorage
        if (!storedToken && typeof window !== 'undefined') {
          storedToken = window.localStorage.getItem('portal_token');
        }
        
        // Method 3: Check all localStorage keys
        if (!storedToken && typeof window !== 'undefined') {
          const keys = Object.keys(window.localStorage);
          console.log('All localStorage keys:', keys);
          
          // Try to find the token with different possible keys
          const possibleKeys = ['portal_token', 'portalToken', 'token'];
          for (const key of possibleKeys) {
            const value = window.localStorage.getItem(key);
            if (value && value.startsWith('ey')) { // JWT tokens typically start with 'ey'
              storedToken = value;
              console.log(`Found token with key: ${key}`);
              break;
            }
          }
        }
        
        return storedToken;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    };

    // Initial load
    const loadedToken = getToken();
    setToken(loadedToken);
    setIsLoading(false);
    
    // Set up interval to check for token changes
    const interval = setInterval(() => {
      const currentToken = getToken();
      if (currentToken !== token) {
        console.log('Token changed, updating...');
        setToken(currentToken);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const saveToken = (newToken: string) => {
    try {
      localStorage.setItem('portal_token', newToken);
      setToken(newToken);
      console.log('Token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const removeToken = () => {
    try {
      localStorage.removeItem('portal_token');
      setToken(null);
      console.log('Token removed successfully');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  const getAuthHeaders = () => {
    if (!token) {
      console.warn('No token available for auth headers');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  return {
    token,
    isLoading,
    saveToken,
    removeToken,
    getAuthHeaders,
    hasToken: !!token,
  };
}