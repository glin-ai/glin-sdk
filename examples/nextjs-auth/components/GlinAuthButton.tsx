'use client';

import { useState } from 'react';
import { GlinAuth, GlinAccount } from '@glin-ai/sdk';

export default function GlinAuthButton() {
  const [account, setAccount] = useState<GlinAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const auth = new GlinAuth();

      // Complete authentication
      const result = await auth.authenticate('v-lawyer Demo App');

      console.log('Authentication successful:', result);

      // In a real app, send result to your backend to create session
      // await fetch('/api/auth/glin', {
      //   method: 'POST',
      //   body: JSON.stringify(result)
      // });

      setAccount(auth.getCurrentAccount());
    } catch (err: any) {
      console.error('Authentication failed:', err);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setError(null);
    // In real app: await fetch('/api/auth/logout', { method: 'POST' });
  };

  if (account) {
    return (
      <div className="auth-container">
        <div className="account-info">
          <div className="account-avatar">👤</div>
          <div className="account-details">
            <div className="account-address">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </div>
            <div className="account-source">{account.source}</div>
          </div>
        </div>
        <button onClick={handleDisconnect} className="btn-disconnect">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-signin"
      >
        {loading ? 'Connecting...' : '🔐 Sign in with GLIN'}
      </button>
      {error && (
        <div className="error-message">
          {error}
          {error.includes('extension not found') && (
            <a href="https://glin.ai/wallet" target="_blank" rel="noopener noreferrer">
              Install GLIN Wallet
            </a>
          )}
        </div>
      )}
    </div>
  );
}
