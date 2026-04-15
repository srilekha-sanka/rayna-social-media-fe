import { useState, useEffect, useRef } from 'react';
import {
  MdPerson,
  MdNotifications,
  MdSecurity,
  MdCheck,
  MdClose,
  MdCameraAlt,
  MdDeleteOutline,
} from 'react-icons/md';
import {
  fetchProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
} from '../services/api';
import '../styles/pages.css';
import '../styles/settings.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: MdPerson },
  { id: 'notifications', label: 'Notifications', icon: MdNotifications },
  { id: 'security', label: 'Security', icon: MdSecurity },
];

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function Toggle({ checked, onChange }) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="settings-toggle__track" />
    </label>
  );
}

// Map API user object → local profile form state
function userToProfile(user) {
  return {
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    title: user.title || '',
    timezone: user.timezone || 'UTC',
    bio: user.bio || '',
    profilePhoto: user.profile_photo || '',
  };
}

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);

  // ─── Profile state ───
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    timezone: 'UTC',
    bio: '',
    profilePhoto: '',
  });
  const [savedProfile, setSavedProfile] = useState(null); // snapshot for cancel
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Notification state ───
  const [notifs, setNotifs] = useState({
    postPublished: true,
    postFailed: true,
    reviewRequired: true,
    weeklyDigest: true,
    teamMentions: true,
    aiSuggestions: false,
    scheduleReminders: true,
    accountAlerts: true,
  });

  // ─── Security state ───
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  // ─── Load profile from API ───
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = await fetchProfile();
        if (cancelled) return;
        const p = userToProfile(user);
        setProfile(p);
        setSavedProfile(p);
      } catch (err) {
        console.error('[Settings] Failed to load profile:', err);
        showToast('Failed to load profile', 'error');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ─── Profile save ───
  async function handleProfileSave() {
    setProfileSaving(true);
    try {
      const user = await updateProfile({
        first_name: profile.firstName,
        last_name: profile.lastName,
        title: profile.title,
        timezone: profile.timezone,
        bio: profile.bio,
      });
      const p = userToProfile(user);
      setProfile(p);
      setSavedProfile(p);
      showToast('Profile saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileCancel() {
    if (savedProfile) setProfile(savedProfile);
  }

  // ─── Photo upload ───
  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const user = await uploadProfilePhoto(file);
      const p = userToProfile(user);
      setProfile(p);
      setSavedProfile(p);
      showToast('Photo updated');
    } catch (err) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setPhotoUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePhotoRemove() {
    setPhotoUploading(true);
    try {
      const user = await removeProfilePhoto();
      const p = userToProfile(user);
      setProfile(p);
      setSavedProfile(p);
      showToast('Photo removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove photo', 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  function handlePasswordChange() {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      showToast('Please fill all password fields', 'error');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwords.newPass.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setPasswords({ current: '', newPass: '', confirm: '' });
    showToast('Password updated successfully');
  }

  // Check if profile form has unsaved changes
  const profileDirty = savedProfile && (
    profile.firstName !== savedProfile.firstName ||
    profile.lastName !== savedProfile.lastName ||
    profile.title !== savedProfile.title ||
    profile.timezone !== savedProfile.timezone ||
    profile.bio !== savedProfile.bio
  );

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account and application preferences.</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <nav className="settings-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-nav__item ${activeTab === tab.id ? 'settings-nav__item--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="settings-nav__icon" />
                <span className="settings-nav__label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <div className="settings-panel">
          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <>
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">Profile Information</h3>
                  <p className="settings-section__desc">
                    Update your personal details and preferences.
                  </p>
                </div>

                {profileLoading ? (
                  <div className="empty-state">
                    <p>Loading profile...</p>
                  </div>
                ) : (
                  <>
                    {/* Avatar section */}
                    <div className="settings-avatar">
                      <div className="settings-avatar__img">
                        {profile.profilePhoto ? (
                          <img src={profile.profilePhoto} alt="Profile" />
                        ) : (
                          <>
                            {(profile.firstName?.[0] || '').toUpperCase()}
                            {(profile.lastName?.[0] || '').toUpperCase()}
                          </>
                        )}
                      </div>
                      <div className="settings-avatar__actions">
                        <span className="settings-avatar__name">
                          {profile.firstName} {profile.lastName}
                        </span>
                        <span className="settings-avatar__email">{profile.email}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="settings-avatar__upload"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoUploading}
                          >
                            <MdCameraAlt />
                            {photoUploading ? 'Uploading...' : 'Change Photo'}
                          </button>
                          {profile.profilePhoto && (
                            <button
                              className="settings-avatar__upload"
                              onClick={handlePhotoRemove}
                              disabled={photoUploading}
                              style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                            >
                              <MdDeleteOutline /> Remove
                            </button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handlePhotoSelect}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="settings-form-grid">
                      <div className="settings-field">
                        <label className="settings-label">First Name</label>
                        <input
                          className="settings-input"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Last Name</label>
                        <input
                          className="settings-input"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">
                          Email <span className="settings-label__hint">(read-only)</span>
                        </label>
                        <input
                          className="settings-input"
                          type="email"
                          value={profile.email}
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Role / Title</label>
                        <input
                          className="settings-input"
                          value={profile.title}
                          placeholder="e.g. Marketing Manager"
                          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Timezone</label>
                        <select
                          className="settings-select"
                          value={profile.timezone}
                          onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="settings-field settings-field--full">
                        <label className="settings-label">
                          Bio <span className="settings-label__hint">(optional)</span>
                        </label>
                        <textarea
                          className="settings-textarea"
                          value={profile.bio}
                          placeholder="Tell us about yourself and your brand..."
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="settings-save-bar">
                      <button
                        className="btn btn--outline"
                        onClick={handleProfileCancel}
                        disabled={!profileDirty}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn--primary"
                        onClick={handleProfileSave}
                        disabled={profileSaving || !profileDirty}
                      >
                        {profileSaving ? 'Saving...' : <><MdCheck /> Save Changes</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ═══ NOTIFICATIONS TAB ═══ */}
          {activeTab === 'notifications' && (
            <>
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">Publishing Alerts</h3>
                  <p className="settings-section__desc">
                    Get notified about your content pipeline activity.
                  </p>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Post Published</span>
                    <span className="settings-toggle__desc">When a scheduled post goes live on any platform.</span>
                  </div>
                  <Toggle checked={notifs.postPublished} onChange={(v) => setNotifs({ ...notifs, postPublished: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Post Failed</span>
                    <span className="settings-toggle__desc">When a post fails to publish due to API or account errors.</span>
                  </div>
                  <Toggle checked={notifs.postFailed} onChange={(v) => setNotifs({ ...notifs, postFailed: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Review Required</span>
                    <span className="settings-toggle__desc">When content is submitted for your approval.</span>
                  </div>
                  <Toggle checked={notifs.reviewRequired} onChange={(v) => setNotifs({ ...notifs, reviewRequired: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Schedule Reminders</span>
                    <span className="settings-toggle__desc">Remind you 1 hour before a post is scheduled to go live.</span>
                  </div>
                  <Toggle checked={notifs.scheduleReminders} onChange={(v) => setNotifs({ ...notifs, scheduleReminders: v })} />
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">Account & Insights</h3>
                  <p className="settings-section__desc">
                    Stay informed about your accounts and analytics.
                  </p>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Weekly Analytics Digest</span>
                    <span className="settings-toggle__desc">A summary of your top-performing content and growth metrics every Monday.</span>
                  </div>
                  <Toggle checked={notifs.weeklyDigest} onChange={(v) => setNotifs({ ...notifs, weeklyDigest: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Account Connection Alerts</span>
                    <span className="settings-toggle__desc">When a connected platform token expires or needs re-authentication.</span>
                  </div>
                  <Toggle checked={notifs.accountAlerts} onChange={(v) => setNotifs({ ...notifs, accountAlerts: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">AI Suggestions</span>
                    <span className="settings-toggle__desc">Get notified when AI detects trending topics in your niche.</span>
                  </div>
                  <Toggle checked={notifs.aiSuggestions} onChange={(v) => setNotifs({ ...notifs, aiSuggestions: v })} />
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle__text">
                    <span className="settings-toggle__label">Team Mentions</span>
                    <span className="settings-toggle__desc">When a team member tags you in a comment or review.</span>
                  </div>
                  <Toggle checked={notifs.teamMentions} onChange={(v) => setNotifs({ ...notifs, teamMentions: v })} />
                </div>
              </div>
            </>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === 'security' && (
            <>
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">Change Password</h3>
                  <p className="settings-section__desc">
                    Update your password to keep your account secure.
                  </p>
                </div>

                <div className="settings-form-grid settings-form-grid--single" style={{ maxWidth: 400 }}>
                  <div className="settings-field">
                    <label className="settings-label">Current Password</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={passwords.current}
                      placeholder="Enter current password"
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">New Password</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={passwords.newPass}
                      placeholder="At least 8 characters"
                      onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Confirm New Password</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={passwords.confirm}
                      placeholder="Re-enter new password"
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-save-bar">
                  <button className="btn btn--primary" onClick={handlePasswordChange}>
                    Update Password
                  </button>
                </div>
              </div>

              <div className="settings-section settings-danger">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">Danger Zone</h3>
                  <p className="settings-section__desc">
                    Irreversible actions. Proceed with caution.
                  </p>
                </div>

                <div className="settings-danger-row">
                  <div className="settings-danger-row__text">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account, all connected platforms, scheduled posts, and analytics data. This cannot be undone.</p>
                  </div>
                  <button className="btn btn--danger btn--sm">Delete Account</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`settings-toast ${toast.type === 'error' ? 'settings-toast--error' : ''}`}>
          <span className="settings-toast__icon">
            {toast.type === 'error' ? <MdClose /> : <MdCheck />}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Settings;
