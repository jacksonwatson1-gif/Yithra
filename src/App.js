import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { getProfile } from './lib/database';
import { hasApiKey } from './lib/ai-engine';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Settings from './components/Settings';
import { Home, MessageCircle, Settings as SettingsIcon } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try { const p = await getProfile(userId); setProfile(p); }
    catch (err) { console.error('Profile load error:', err); }
    finally { setLoading(false); }
  };

  const handleAuth = () => {};
  const handleOnboardingComplete = (profileData) => {
    setProfile({ ...profileData, onboarding_complete: true });
    if (!hasApiKey()) setActiveTab('settings');
  };
  const handleSignOut = () => { setSession(null); setProfile(null); };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', letterSpacing: -1.5 }}>yithra</div>
          <div className="loading-dots" style={{ justifyContent: 'center', marginTop: 16 }}><span /><span /><span /></div>
        </div>
      </div>
    );
  }
  if (!session) { return (<div className="app-container"><Auth onAuth={handleAuth} /></div>); }
  if (!profile?.onboarding_complete) { return (<div className="app-container"><Onboarding userId={session.user.id} onComplete={handleOnboardingComplete} /></div>); }

  return (
    <div className="app-container">
      {activeTab === 'home' && <Dashboard userId={session.user.id} profile={profile} />}
      {activeTab === 'chat' && <Chat userId={session.user.id} />}
      {activeTab === 'settings' && <Settings profile={profile} userId={session.user.id} onSignOut={handleSignOut} onApiKeyChange={() => setApiKeyReady(hasApiKey())} />}
      <nav className="bottom-nav">
        <button className={'nav-item ' + (activeTab === 'home' ? 'active' : '')} onClick={() => setActiveTab('home')}><Home size={22} />Home</button>
        <button className={'nav-item ' + (activeTab === 'chat' ? 'active' : '')} onClick={() => setActiveTab('chat')}><MessageCircle size={22} />Log</button>
        <button className={'nav-item ' + (activeTab === 'settings' ? 'active' : '')} onClick={() => setActiveTab('settings')}><SettingsIcon size={22} />Settings</button>
      </nav>
    </div>
  );
}
export default App;
