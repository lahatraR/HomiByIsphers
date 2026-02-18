import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', role: '', createdAt: '' });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          const res = await api.get<any>(`/users/${user.id}`);
          const data = res.data;
          setProfile({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || user.email,
            role: data.role || user.role,
            createdAt: data.createdAt || '',
          });
          setForm({ firstName: data.firstName || '', lastName: data.lastName || '' });
        }
      } catch (err: any) {
        setError(err.message || t('profile.errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/users/${user?.id}`, form);
      setProfile(p => ({ ...p, ...form }));
      if (user) {
        const updated = { ...user, firstName: form.firstName, lastName: form.lastName };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      setEditing(false);
      setSuccess(t('profile.profileUpdated'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || t('profile.errorUpdating'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError(null);
    setPwdSuccess(null);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError(t('profile.passwordMismatch'));
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError(t('profile.passwordTooShort'));
      return;
    }
    setPwdSaving(true);
    try {
      await api.put(`/users/${user?.id}/password`, {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdSuccess(t('profile.passwordChanged'));
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwdForm(false);
      setTimeout(() => setPwdSuccess(null), 3000);
    } catch (err: any) {
      setPwdError(err.message || t('profile.errorChangingPassword'));
    } finally {
      setPwdSaving(false);
    }
  };

  const getInitials = () => {
    if (profile.firstName && profile.lastName) return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    return (profile.email?.substring(0, 2) || '??').toUpperCase();
  };

  if (isLoading) return <MainLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>

        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
        {pwdSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{pwdSuccess}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {getInitials()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.email}
              </h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${profile.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                {profile.role === 'ROLE_ADMIN' ? t('profile.roleAdmin') : t('profile.roleUser')}
              </span>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('profile.firstName')}</div>
                  <div className="text-gray-900 font-medium">{profile.firstName || '\u2014'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('profile.lastName')}</div>
                  <div className="text-gray-900 font-medium">{profile.lastName || '\u2014'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('profile.email')}</div>
                  <div className="text-gray-900 font-medium">{profile.email}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('profile.memberSince')}</div>
                  <div className="text-gray-900 font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '\u2014'}</div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setEditing(true)}>{t('profile.editProfile')}</Button>
                <button onClick={() => setShowPwdForm(!showPwdForm)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm">
                  {showPwdForm ? t('profile.cancelChangePassword') : t('profile.changePassword')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.firstName')}</label>
                  <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.lastName')}</label>
                  <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
                <button onClick={() => { setEditing(false); setForm({ firstName: profile.firstName, lastName: profile.lastName }); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </Card>

        {/* Password Change Form */}
        {showPwdForm && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.changePassword')}</h3>
            {pwdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{pwdError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.currentPassword')}</label>
                <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.newPassword')}</label>
                <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.confirmPassword')}</label>
                <input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button onClick={handlePasswordChange} disabled={pwdSaving}>{pwdSaving ? t('profile.changingPassword') : t('profile.changePasswordBtn')}</Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
