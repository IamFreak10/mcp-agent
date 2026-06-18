import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Save,
  Terminal,
  Mail,
  Bot,
  Key,
  Link2,
  Box,
  Send,
  Trash2,
  Globe,
  Newspaper,
  Users,
} from 'lucide-react';

export default function Connector() {
  const [config, setConfig] = useState({
    userName: '',
    providers: [],
    services: {},
    crawlers: {
      facebookPages: [],
      universityWeb: [],
      newsPortals: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [tgPhone, setTgPhone] = useState('');
  const [tgApiId, setTgApiId] = useState('');
  const [tgApiHash, setTgApiHash] = useState('');
  const [tgOtp, setTgOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState('idle');
  const [verifyStatus, setVerifyStatus] = useState('idle');
  const [otpSent, setOtpSent] = useState(false);
  const [tgStatus, setTgStatus] = useState(null);
  const [tgShowFull, setTgShowFull] = useState(false);

  // crawler temp inputs
  const [fbInput, setFbInput] = useState({ name: '', url: '' });
  const [uniInput, setUniInput] = useState({ name: '', url: '' });
  const [newsInput, setNewsInput] = useState({ name: '', url: '' });

  useEffect(() => {
    fetchConfig();
    fetchTgStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('http://localhost:10000/config');
      const data = res.data.data;
      setConfig({
        userName: data.userName || '',
        providers: data.providers || [],
        services: data.services || {},
        crawlers: {
          facebookPages: Array.isArray(data.crawlers?.facebookPages)
            ? data.crawlers.facebookPages
            : Object.entries(data.crawlers?.facebookPages || {}).map(
                ([name, url]) => ({
                  name,
                  url,
                  rss: `https://rsshub.app/facebook/page/${url.replace(/\/$/, '').split('/').pop()}`,
                })
              ),
          universityWeb: Array.isArray(data.crawlers?.universityWeb)
            ? data.crawlers.universityWeb
            : data.crawlers?.universityWeb?.url
              ? [{ name: 'University', url: data.crawlers.universityWeb.url }]
              : [],
          newsPortals: Array.isArray(data.crawlers?.newsPortals)
            ? data.crawlers.newsPortals
            : data.crawlers?.newsPortals?.url
              ? [{ name: 'News Portal', url: data.crawlers.newsPortals.url }]
              : [],
        },
      });
    } catch (e) {
      console.error('Config load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTgStatus = async () => {
    try {
      const res = await axios.get(
        'http://localhost:10000/telegram-auth/status'
      );
      setTgStatus(res.data);
    } catch {
      setTgStatus(null);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:10000/config/ai-models', config);
      alert('Configuration Saved Successfully!');
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const addProvider = () => {
    setConfig((prev) => ({
      ...prev,
      providers: [
        ...(prev.providers || []),
        { name: '', url: '', keys: [], models: [] },
      ],
    }));
  };

  const updateProvider = (index, field, value) => {
    setConfig((prev) => {
      const newProviders = [...(prev.providers || [])];
      if (field === 'models' || field === 'keys') {
        newProviders[index] = {
          ...newProviders[index],
          [field]:
            typeof value === 'string'
              ? value.split(',').map((item) => item.trim())
              : value,
        };
      } else {
        newProviders[index] = { ...newProviders[index], [field]: value };
      }
      return { ...prev, providers: newProviders };
    });
  };

  const updateService = (service, key, value) => {
    setConfig((prev) => ({
      ...prev,
      services: {
        ...(prev.services || {}),
        [service]: { ...(prev.services?.[service] || {}), [key]: value },
      },
    }));
  };

  const requestOtp = async () => {
    if (!tgPhone || !tgApiId || !tgApiHash) {
      alert('Phone, API ID and API Hash are required.');
      return;
    }
    setOtpStatus('loading');
    try {
      const res = await axios.post(
        'http://localhost:10000/telegram-auth/request-otp',
        { phone: tgPhone, apiId: tgApiId, apiHash: tgApiHash }
      );
      if (res.data.success) {
        setOtpStatus('ok');
        setOtpSent(true);
      } else setOtpStatus('error');
    } catch (e) {
      setOtpStatus('error');
    }
  };

  const verifyOtp = async () => {
    if (!tgOtp) {
      alert('Enter OTP code.');
      return;
    }
    setVerifyStatus('loading');
    try {
      const res = await axios.post(
        'http://localhost:10000/telegram-auth/submit-otp',
        { phone: tgPhone, code: tgOtp, apiId: tgApiId, apiHash: tgApiHash }
      );
      if (res.data.success) {
        setVerifyStatus('ok');
        fetchTgStatus();
        setTgShowFull(false);
      } else setVerifyStatus('error');
    } catch (e) {
      setVerifyStatus('error');
    }
  };

  // ---- Crawler helpers ----
  const extractFbSlug = (url) => url.replace(/\/$/, '').split('/').pop();

  const addToList = (key, item, reset) => {
    setConfig((prev) => ({
      ...prev,
      crawlers: {
        ...prev.crawlers,
        [key]: [...(prev.crawlers[key] || []), item],
      },
    }));
    reset();
  };

  const removeFromList = (key, i) => {
    setConfig((prev) => ({
      ...prev,
      crawlers: {
        ...prev.crawlers,
        [key]: prev.crawlers[key].filter((_, idx) => idx !== i),
      },
    }));
  };

  const addFbPage = () => {
    if (!fbInput.name || !fbInput.url) return;
    const slug = extractFbSlug(fbInput.url);
    addToList(
      'facebookPages',
      {
        name: fbInput.name,
        url: fbInput.url,
        rss: `https://rsshub.app/facebook/page/${slug}`,
      },
      () => setFbInput({ name: '', url: '' })
    );
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-primary font-bold">
        Loading Core...
      </div>
    );

  const inputCls =
    'bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 outline-none transition-colors';
  const rowCls = 'flex gap-2 items-center';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-white">
            <Terminal className="text-blue-500" /> System Core
          </h1>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20"
          >
            <Save size={18} /> Save Changes
          </button>
        </header>

        {/* Gmail Section */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
            <Mail className="text-red-500" size={20} /> Gmail Integration
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Email Address"
              value={config.services?.gmail?.EMAIL_USER || ''}
              onChange={(e) =>
                updateService('gmail', 'EMAIL_USER', e.target.value)
              }
              className={`${inputCls} w-full`}
            />
            <input
              type="password"
              placeholder="App Password"
              value={config.services?.gmail?.EMAIL_PASS || ''}
              onChange={(e) =>
                updateService('gmail', 'EMAIL_PASS', e.target.value)
              }
              className={`${inputCls} w-full`}
            />
          </div>
        </div>

        {/* Telegram Section */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1 text-white">
            <Send className="text-sky-400" size={20} /> Telegram Integration
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Connect your Telegram account to send notifications.
          </p>

          {/* Connected status card */}
          {tgStatus?.connected && !tgShowFull && (
            <div className="mb-5 bg-slate-950 border border-emerald-800/50 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  ✓ Connected
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-1">
                  <span className="text-slate-500">Phone</span>
                  <span className="text-slate-200 font-mono">
                    {tgStatus.phone}
                  </span>
                  <span className="text-slate-500">API ID</span>
                  <span className="text-slate-200 font-mono">
                    {tgStatus.apiId}
                  </span>
                  <span className="text-slate-500">API Hash</span>
                  <span className="text-slate-200 font-mono">
                    {tgStatus.apiHash}
                  </span>
                  <span className="text-slate-500">Session</span>
                  <span className="text-slate-400 font-mono truncate">
                    {tgStatus.session}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setTgShowFull(true)}
                className="shrink-0 text-xs text-sky-400 hover:text-sky-300 border border-sky-800 px-3 py-1.5 rounded-lg transition"
              >
                Re-connect
              </button>
            </div>
          )}

          {/* Auth form */}
          {(!tgStatus?.connected || tgShowFull) && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Step 1 — API Credentials
                  </p>

                  <a
                    href="https://my.telegram.org/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
                  >
                    Get API ID &amp; Hash &nbsp;&#8599;
                  </a>
                </div>
                <div className="space-y-3">
                  <input
                    placeholder="Phone Number (+880...)"
                    value={tgPhone}
                    onChange={(e) => setTgPhone(e.target.value)}
                    className={`${inputCls} w-full`}
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      placeholder="API ID"
                      value={tgApiId}
                      onChange={(e) => setTgApiId(e.target.value)}
                      className={`${inputCls} w-full`}
                    />
                    <input
                      type="password"
                      placeholder="API Hash"
                      value={tgApiHash}
                      onChange={(e) => setTgApiHash(e.target.value)}
                      className={`${inputCls} w-full`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Step 2 — Request OTP
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={requestOtp}
                    disabled={otpStatus === 'loading'}
                    className="flex-1 bg-sky-900/40 hover:bg-sky-900/60 border border-sky-800 text-sky-300 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-40"
                  >
                    {otpStatus === 'loading' ? 'Sending...' : 'Send OTP'}
                  </button>
                  {otpStatus === 'ok' && (
                    <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                      OTP Sent ✓
                    </span>
                  )}
                  {otpStatus === 'error' && (
                    <span className="text-xs text-red-400 font-medium whitespace-nowrap">
                      Failed ✗
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Step 3 — Verify OTP
                </p>
                <div className="flex gap-3">
                  <input
                    placeholder="Enter OTP code"
                    value={tgOtp}
                    onChange={(e) => setTgOtp(e.target.value)}
                    maxLength={6}
                    className={`flex-1 ${inputCls}`}
                  />
                  <button
                    onClick={verifyOtp}
                    disabled={!otpSent || verifyStatus === 'loading'}
                    className="bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 px-5 rounded-lg text-sm font-medium disabled:opacity-40 transition"
                  >
                    {verifyStatus === 'loading' ? '...' : 'Verify'}
                  </button>
                  {verifyStatus === 'ok' && (
                    <span className="self-center text-xs text-emerald-400 font-medium whitespace-nowrap">
                      Saved ✓
                    </span>
                  )}
                  {verifyStatus === 'error' && (
                    <span className="self-center text-xs text-red-400 font-medium whitespace-nowrap">
                      Failed ✗
                    </span>
                  )}
                </div>
              </div>

              {tgShowFull && (
                <button
                  onClick={() => setTgShowFull(false)}
                  className="text-xs text-slate-500 hover:text-slate-400 transition"
                >
                  ← Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* DATA SOURCES / CRAWLERS */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Globe className="text-purple-400" size={20} /> Data Sources
          </h2>

          {/* Facebook Pages */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={13} className="text-blue-400" /> Facebook Pages
            </p>
            <p className="text-xs text-slate-600">
              Paste normal Facebook URL — RSS auto-generated via RSSHub
            </p>
            {(config.crawlers.facebookPages || []).map((pg, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-medium text-white">{pg.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{pg.url}</p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    RSS → {pg.rss}
                  </p>
                </div>
                <button
                  onClick={() => removeFromList('facebookPages', i)}
                  className="text-slate-600 hover:text-red-400 transition ml-3 mt-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className={rowCls}>
              <input
                placeholder="Page name"
                value={fbInput.name}
                onChange={(e) =>
                  setFbInput((p) => ({ ...p, name: e.target.value }))
                }
                className={`${inputCls} w-1/3`}
              />
              <input
                placeholder="https://www.facebook.com/pagename"
                value={fbInput.url}
                onChange={(e) =>
                  setFbInput((p) => ({ ...p, url: e.target.value }))
                }
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={addFbPage}
                disabled={!fbInput.name || !fbInput.url}
                className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-800 text-blue-400 px-3 py-3 rounded-lg transition disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* University Websites */}
          <div className="space-y-3 border-t border-slate-800 pt-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              🎓 University Websites
            </p>
            {(config.crawlers.universityWeb || []).map((s, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.url}</p>
                </div>
                <button
                  onClick={() => removeFromList('universityWeb', i)}
                  className="text-slate-600 hover:text-red-400 transition ml-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className={rowCls}>
              <input
                placeholder="Site name"
                value={uniInput.name}
                onChange={(e) =>
                  setUniInput((p) => ({ ...p, name: e.target.value }))
                }
                className={`${inputCls} w-1/3`}
              />
              <input
                placeholder="https://www.bu.ac.bd/notice-board"
                value={uniInput.url}
                onChange={(e) =>
                  setUniInput((p) => ({ ...p, url: e.target.value }))
                }
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={() => {
                  if (!uniInput.name || !uniInput.url) return;
                  addToList(
                    'universityWeb',
                    { name: uniInput.name, url: uniInput.url },
                    () => setUniInput({ name: '', url: '' })
                  );
                }}
                disabled={!uniInput.name || !uniInput.url}
                className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-800 text-amber-400 px-3 py-3 rounded-lg transition disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* News Portals */}
          <div className="space-y-3 border-t border-slate-800 pt-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Newspaper size={13} className="text-emerald-400" /> News Portals
            </p>
            {(config.crawlers.newsPortals || []).map((s, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.url}</p>
                </div>
                <button
                  onClick={() => removeFromList('newsPortals', i)}
                  className="text-slate-600 hover:text-red-400 transition ml-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className={rowCls}>
              <input
                placeholder="Portal name"
                value={newsInput.name}
                onChange={(e) =>
                  setNewsInput((p) => ({ ...p, name: e.target.value }))
                }
                className={`${inputCls} w-1/3`}
              />
              <input
                placeholder="https://prothomalo.com/feed"
                value={newsInput.url}
                onChange={(e) =>
                  setNewsInput((p) => ({ ...p, url: e.target.value }))
                }
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={() => {
                  if (!newsInput.name || !newsInput.url) return;
                  addToList(
                    'newsPortals',
                    { name: newsInput.name, url: newsInput.url },
                    () => setNewsInput({ name: '', url: '' })
                  );
                }}
                disabled={!newsInput.name || !newsInput.url}
                className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-800 text-emerald-400 px-3 py-3 rounded-lg transition disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Providers Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Bot className="text-emerald-500" /> AI Providers
            </h2>
            <button
              onClick={addProvider}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition"
            >
              <Plus size={16} /> Add Provider
            </button>
          </div>
          {(config.providers || []).map((p, i) => (
            <div
              key={i}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner"
            >
              <input
                placeholder="Provider Name (e.g. Groq)"
                value={p.name || ''}
                onChange={(e) => updateProvider(i, 'name', e.target.value)}
                className={`w-full ${inputCls} font-bold`}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <Key size={16} className="text-slate-500" />
                  <input
                    placeholder="API Keys (comma separated)"
                    value={Array.isArray(p.keys) ? p.keys.join(', ') : ''}
                    onChange={(e) => updateProvider(i, 'keys', e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <Box size={16} className="text-slate-500" />
                  <input
                    placeholder="Models (comma separated)"
                    value={p.models ? p.models.join(', ') : ''}
                    onChange={(e) =>
                      updateProvider(i, 'models', e.target.value)
                    }
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                <Link2 size={16} className="text-slate-500" />
                <input
                  placeholder="URL"
                  value={p.url || ''}
                  onChange={(e) => updateProvider(i, 'url', e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Google Calendar Section */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
            <Globe className="text-blue-400" size={20} /> Google Calendar
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Client ID"
              value={config.services?.googleCalendar?.CLIENT_ID || ''}
              onChange={(e) =>
                updateService('googleCalendar', 'CLIENT_ID', e.target.value)
              }
              className={`${inputCls} w-full`}
            />
            <input
              type="password"
              placeholder="Client Secret"
              value={config.services?.googleCalendar?.CLIENT_SECRET || ''}
              onChange={(e) =>
                updateService('googleCalendar', 'CLIENT_SECRET', e.target.value)
              }
              className={`${inputCls} w-full`}
            />
          </div>
          <button
            onClick={() =>
              window.open(
                'http://localhost:10000/google-service-auth/login',
                '_blank'
              )
            }
            className="w-full bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-300 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Globe size={16} /> Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}
