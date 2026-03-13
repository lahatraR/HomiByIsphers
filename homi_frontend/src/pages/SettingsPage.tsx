import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button, IconSun, IconMoon, IconMonitor, IconBell, IconLock } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface UserSettings {
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

export const SettingsPage: React.FC = () => {
  // Lire le thème depuis localStorage pour éviter le flash light→dark au chargement
  const savedTheme = localStorage.getItem('theme') || 'light';
  const [settings, setSettings] = useState<UserSettings>({
    theme: savedTheme,
    language: 'fr',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  // Apply theme to DOM whenever settings.theme changes
  useEffect(() => {
    const applyTheme = (theme: string) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // auto = follow OS preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
      localStorage.setItem('theme', theme);
    };
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Sync language with i18n when settings.language changes
  useEffect(() => {
    if (settings.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<UserSettings>('/settings');
        setSettings(res.data);
      } catch (err: any) {
        // Use defaults if no settings saved yet
        console.warn('Settings not found, using defaults');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put('/settings', settings);
      setSuccess(t('settings.saved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || t('settings.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <MainLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('settings.subtitle')}</p>
        </div>

        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Apparence */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconSun className="w-5 h-5" />
            {t('settings.appearance')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.theme')}</label>
              <div className="flex gap-3">
                {[{ value: 'light', label: t('settings.themeLight'), icon: <IconSun className="w-7 h-7 mx-auto text-yellow-500" /> }, { value: 'dark', label: t('settings.themeDark'), icon: <IconMoon className="w-7 h-7 mx-auto text-indigo-500" /> }, { value: 'auto', label: t('settings.themeAuto'), icon: <IconMonitor className="w-7 h-7 mx-auto text-gray-600" /> }].map(opt => (
                  <button key={opt.value} onClick={() => setSettings(s => ({ ...s, theme: opt.value }))}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${settings.theme === opt.value ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/20' : 'border-gray-200 hover:border-gray-300 dark:border-[#3a3a3c] dark:hover:border-[#48484a]'}`}>
                    <div className="mb-1">{opt.icon}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-[#d4d4d4]">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.language')}</label>
              <select value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[#1c1c1e] dark:text-[#f5f5f5] dark:border-[#48484a]">
                <option value="fr">Francais</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconBell className="w-5 h-5" />
            {t('settings.notifications')}
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">{t('settings.emailNotifications')}</div>
                <div className="text-sm text-gray-500">{t('settings.emailNotificationsDesc')}</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={settings.emailNotifications}
                  onChange={e => setSettings(s => ({ ...s, emailNotifications: e.target.checked }))} />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 dark:bg-[#48484a] rounded-full transition-colors"></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#ffffff] rounded-full shadow transition-transform ${settings.emailNotifications ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">{t('settings.pushNotifications')}</div>
                <div className="text-sm text-gray-500">{t('settings.pushNotificationsDesc')}</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={settings.pushNotifications}
                  onChange={e => setSettings(s => ({ ...s, pushNotifications: e.target.checked }))} />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 dark:bg-[#48484a] rounded-full transition-colors"></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#ffffff] rounded-full shadow transition-transform ${settings.pushNotifications ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconLock className="w-5 h-5" />
            {t('settings.security')}
          </h2>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <div className="font-medium text-gray-900">{t('settings.twoFactorAuth')}</div>
              <div className="text-sm text-gray-500">{t('settings.twoFactorAuthDesc')}</div>
            </div>
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={settings.twoFactorEnabled}
                onChange={e => setSettings(s => ({ ...s, twoFactorEnabled: e.target.checked }))} />
              <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 dark:bg-[#48484a] rounded-full transition-colors"></div>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#ffffff] rounded-full shadow transition-transform ${settings.twoFactorEnabled ? 'translate-x-5' : ''}`}></div>
            </div>
          </label>
        </Card>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
