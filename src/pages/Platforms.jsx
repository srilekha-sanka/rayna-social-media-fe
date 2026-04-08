import { useState } from 'react';
import { MdRefresh, MdLinkOff, MdLink } from 'react-icons/md';
import { PLATFORMS, CONNECTABLE_PLATFORMS, getPlatformConfig } from '../utils/platforms';
import { disconnectSocialAccount, refreshSocialAccount } from '../services/api';
import useConnectSocial from '../hooks/useConnectSocial';
import '../styles/pages.css';
import '../styles/platforms.css';

const STATUS_BADGE = {
  CONNECTED: { label: 'Connected', cls: 'badge--active' },
  EXPIRED: { label: 'Expired', cls: 'badge--paused' },
  DISCONNECTED: { label: 'Disconnected', cls: 'badge--draft' },
};

function Platforms() {
  const { accounts, loading, connecting, connectingPlatform, connect, refreshAccounts } = useConnectSocial();
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmDisconnect, setConfirmDisconnect] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  }

  async function handleConnect(platformId, connectionType) {
    const result = await connect(platformId, connectionType);
    if (result.success) {
      const names = result.usernames?.join(', ') || platformId;
      showToast(`Connected ${names} on ${getPlatformConfig(platformId)?.name || platformId}`);
    } else if (result.error !== 'popup_closed') {
      showToast(`Failed to connect ${getPlatformConfig(platformId)?.name || platformId}. Please try again.`, 'error');
    }
  }

  async function handleDisconnect(account) {
    setConfirmDisconnect(null);
    try {
      await disconnectSocialAccount(account.id);
      showToast(`Disconnected @${account.username} from ${getPlatformConfig(account.platform)?.name || account.platform}`);
      refreshAccounts();
    } catch (err) {
      showToast(`Failed to disconnect: ${err.message}`, 'error');
    }
  }

  async function handleRefresh(account) {
    setRefreshingId(account.id);
    try {
      await refreshSocialAccount(account.id);
      await refreshAccounts();
      showToast(`Refreshed @${account.username}`);
    } catch (err) {
      showToast(`Failed to refresh: ${err.message}`, 'error');
    } finally {
      setRefreshingId(null);
    }
  }

  // Group connected accounts by platform
  const accountsByPlatform = {};
  for (const acct of accounts) {
    if (acct.status === 'DISCONNECTED') continue;
    if (!accountsByPlatform[acct.platform]) accountsByPlatform[acct.platform] = [];
    accountsByPlatform[acct.platform].push(acct);
  }

  const connectablePlatforms = PLATFORMS.filter((p) => CONNECTABLE_PLATFORMS.includes(p.id));

  return (
    <div>
      <div className="page-header">
        <h2>Platforms</h2>
        <p>Connect and manage your social media accounts.</p>
      </div>

      {/* Toast */}
      {toast.message && (
        <div className={`plat__toast plat__toast--${toast.type || 'success'}`}>
          {toast.message}
        </div>
      )}

      {/* Connect buttons */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__header">
          <h3 className="card__title">Connect a New Account</h3>
        </div>
        <div className="platform-grid">
          {connectablePlatforms.map((p) => {
            const Icon = p.icon;
            const isConnecting = connecting && connectingPlatform === p.id;
            return (
              <button
                key={p.id}
                className="platform-chip"
                onClick={() => handleConnect(p.id, p.id === 'instagram' ? 'instagram' : undefined)}
                disabled={connecting}
              >
                <span className="platform-chip__icon" style={{ color: p.color === '#000000' ? '#1a1a2e' : p.color }}>
                  <Icon />
                </span>
                {isConnecting ? 'Connecting...' : `Connect ${p.name}`}
                {!isConnecting && <MdLink style={{ fontSize: 14, opacity: 0.5 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected accounts */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Connected Accounts</h3>
          <button className="btn btn--outline btn--sm" onClick={refreshAccounts} disabled={loading}>
            <MdRefresh className={loading ? 'plat__spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="cc__spinner" />
            <p>Loading accounts...</p>
          </div>
        ) : accounts.filter((a) => a.status !== 'DISCONNECTED').length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><MdLink /></div>
            <h3>No accounts connected</h3>
            <p>Connect your social media accounts above to start publishing.</p>
          </div>
        ) : (
          <div className="plat__accounts-grid">
            {connectablePlatforms.map((platform) => {
              const platAccounts = accountsByPlatform[platform.id] || [];
              if (platAccounts.length === 0) return null;
              const Icon = platform.icon;

              return platAccounts.map((acct) => {
                const badge = STATUS_BADGE[acct.status] || STATUS_BADGE.CONNECTED;
                return (
                  <div className="plat__account-card" key={acct.id}>
                    <div className="plat__account-header">
                      <span
                        className="plat__account-icon"
                        style={{
                          background: platform.color + '15',
                          color: platform.color === '#000000' ? '#1a1a2e' : platform.color,
                        }}
                      >
                        <Icon />
                      </span>
                      <div className="plat__account-info">
                        <span className="plat__account-username">@{acct.username}</span>
                        <span className="plat__account-platform">{platform.name}</span>
                      </div>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="plat__account-meta">
                      <span>Connected {new Date(acct.connected_at).toLocaleDateString()}</span>
                      {acct.connector && <span>by {acct.connector.first_name || acct.connector.email}</span>}
                    </div>
                    <div className="plat__account-actions">
                      {acct.status === 'EXPIRED' && (
                        <button className="btn btn--primary btn--sm" onClick={() => handleConnect(platform.id, platform.id === 'instagram' ? 'instagram' : undefined)}>
                          Reconnect
                        </button>
                      )}
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => handleRefresh(acct)}
                        disabled={refreshingId === acct.id}
                      >
                        <MdRefresh className={refreshingId === acct.id ? 'plat__spin' : ''} />
                        {refreshingId === acct.id ? 'Refreshing...' : 'Refresh'}
                      </button>
                      <button
                        className="btn btn--outline btn--sm plat__btn-danger"
                        onClick={() => setConfirmDisconnect(acct)}
                      >
                        <MdLinkOff /> Disconnect
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>

      {/* Disconnect confirmation modal */}
      {confirmDisconnect && (
        <div className="cc__overlay" onClick={() => setConfirmDisconnect(null)}>
          <div className="cc__modal plat__confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Disconnect Account</h3>
            <p>
              Are you sure you want to disconnect <strong>@{confirmDisconnect.username}</strong> on{' '}
              <strong>{getPlatformConfig(confirmDisconnect.platform)?.name || confirmDisconnect.platform}</strong>?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              You can reconnect it later, but scheduled posts to this account will not be published.
            </p>
            <div className="plat__confirm-actions">
              <button className="btn btn--outline" onClick={() => setConfirmDisconnect(null)}>Cancel</button>
              <button className="btn plat__btn-danger-fill" onClick={() => handleDisconnect(confirmDisconnect)}>
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Platforms;
