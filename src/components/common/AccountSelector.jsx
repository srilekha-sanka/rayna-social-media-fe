import { useState, useEffect } from 'react';
import { MdCheckCircle } from 'react-icons/md';
import { fetchSocialAccounts } from '../../services/api';
import { getPlatformConfig } from '../../utils/platforms';
import '../../styles/platforms.css';

/**
 * Multi-select of connected social accounts, grouped by platform.
 * @param {string[]} selectedIds - Currently selected account UUIDs
 * @param {(ids: string[]) => void} onChange - Called with updated selection
 * @param {string[]} [filterPlatforms] - Optional: only show these platform IDs
 */
export default function AccountSelector({ selectedIds = [], onChange, filterPlatforms }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSocialAccounts({ status: 'CONNECTED' })
      .then(({ accounts: list }) => {
        if (active) setAccounts(list);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return null;

  const filtered = filterPlatforms
    ? accounts.filter((a) => filterPlatforms.includes(a.platform))
    : accounts;

  if (filtered.length === 0) return null;

  // Group by platform
  const grouped = {};
  for (const acct of filtered) {
    if (!grouped[acct.platform]) grouped[acct.platform] = [];
    grouped[acct.platform].push(acct);
  }

  function toggle(id) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  return (
    <div className="acct-select">
      <span className="acct-select__label">Post to accounts</span>
      {Object.entries(grouped).map(([platformId, accts]) => {
        const config = getPlatformConfig(platformId);
        if (!config) return null;
        const Icon = config.icon;

        return (
          <div key={platformId}>
            <div className="acct-select__group-title">
              <Icon style={{ verticalAlign: 'middle', marginRight: 4, color: config.color === '#000000' ? '#1a1a2e' : config.color }} />
              {config.name}
            </div>
            <div className="acct-select__list">
              {accts.map((acct) => {
                const selected = selectedIds.includes(acct.id);
                return (
                  <button
                    key={acct.id}
                    type="button"
                    className={`acct-select__chip${selected ? ' acct-select__chip--selected' : ''}`}
                    onClick={() => toggle(acct.id)}
                  >
                    <span className="acct-select__chip-icon" style={{ color: config.color === '#000000' ? '#1a1a2e' : config.color }}>
                      <Icon />
                    </span>
                    @{acct.username}
                    {selected && <MdCheckCircle className="acct-select__chip-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
