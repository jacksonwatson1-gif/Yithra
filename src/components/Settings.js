import React, { useState, useEffect } from 'react';
import { signOut } from '../lib/database';
import { hasApiKey, setApiKey } from '../lib/ai-engine';
import { isPushSupported, getNotificationPermission, subscribeToPush, unsubscribeFromPush } from '../lib/push';
import { LogOut, User, Bell, Shield, Key, BellRing, BellOff } from 'lucide-react';

export default function Settings({ profile, userId, onSignOut, onApiKeyChange }) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(hasApiKey());
  const pushSupported = isPushSupported();

  useEffect(() => { setPushEnabled(getNotificationPermission() === 'granted'); }, []);

  const handleSignOut = async () => { try { await signOut(); onSignOut(); } catch (err) { console.error(err); } };

  const togglePush = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) { await unsubscribeFromPush(userId); setPushEnabled(false); }
      else { const sub = await subscribeToPush(userId); setPushEnabled(!!sub); }
    } catch (err) { console.error(err); }
    finally { setPushLoading(false); }
  };

  const handleKeySave = () => {
    if (keyInput.startsWith('sk-ant-')) {
      setApiKey(keyInput);
      setKeySaved(true);
      setKeyInput('');
      if (onApiKeyChange) onApiKeyChange();
    }
  };

  const goalLabels = {
    save_emergency: 'Build emergency fund', pay_debt: 'Pay off debt',
    save_purchase: 'Save for purchase', invest: 'Start investing',
    retire_early: 'Retire early', budget_basics: 'Learn to budget',
    reduce_spending: 'Spend less', build_credit: 'Build credit'
  };

  return (
    <div className="page">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Settings</div>
      <div className="settings-section">
        <div className="section-title"><Key size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />AI Engine</div>
        <div style={{ padding: '12px 0' }}>
          {keySaved ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15 }}>Anthropic API Key</div>
                <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>Connected</div>
              </div>
              <button onClick={() => { setApiKey(''); setKeySaved(false); }}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 12, cursor: 'pointer' }}>
                Change
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                Enter your Anthropic API key to enable the AI. Get one at console.anthropic.com. It stays on your device only.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input-field" type="password" placeholder="sk-ant-..." value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)} style={{ flex: 1, fontSize: 14, padding: '10px 14px' }} />
                <button className="btn-primary" onClick={handleKeySave} disabled={!keyInput.startsWith('sk-ant-')}
                  style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="settings-section">
        <div className="section-title"><User size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Profile</div>
        <div className="settings-item"><span className="settings-item-label">Age Range</span><span className="settings-item-value">{profile?.age_range || '\u2014'}</span></div>
        <div className="settings-item"><span className="settings-item-label">Financial Goal</span><span className="settings-item-value">{goalLabels[profile?.top_goal] || '\u2014'}</span></div>
        <div className="settings-item"><span className="settings-item-label">Dependents</span><span className="settings-item-value">{profile?.dependents ?? '\u2014'}</span></div>
      </div>
      <div className="settings-section">
        <div className="section-title"><Bell size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Notifications</div>
        {pushSupported ? (
          <div className="settings-item">
            <span className="settings-item-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {pushEnabled ? <BellRing size={16} color="var(--accent)" /> : <BellOff size={16} />} Daily Money Move alerts
            </span>
            <button onClick={togglePush} disabled={pushLoading}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: pushEnabled ? '1px solid var(--accent)' : '1px solid var(--border)', background: pushEnabled ? 'var(--accent-glow)' : 'var(--bg-input)', color: pushEnabled ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {pushLoading ? '...' : pushEnabled ? 'On' : 'Off'}
            </button>
          </div>
        ) : (
          <div className="settings-item"><span className="settings-item-label">Push notifications</span><span className="settings-item-value">Not supported</span></div>
        )}
      </div>
      <div className="settings-section">
        <div className="section-title"><Shield size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Privacy</div>
        <div className="settings-item"><span className="settings-item-label">API key storage</span><span className="settings-item-value">Your device only</span></div>
        <div className="settings-item"><span className="settings-item-label">Financial data</span><span className="settings-item-value">Encrypted (Supabase)</span></div>
      </div>
      <button className="btn-primary" onClick={handleSignOut}
        style={{ background: 'var(--bg-card)', color: 'var(--danger)', border: '1px solid var(--border)', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogOut size={16} /> Sign Out
      </button>
      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div>
          <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: 'var(--text-muted)', marginRight: 16 }}>Privacy Policy</a>
          <a href="/terms.html" target="_blank" rel="noopener" style={{ color: 'var(--text-muted)' }}>Terms of Service</a>
        </div>
        <div>Yithra v0.1.0</div>
      </div>
    </div>
  );
}
