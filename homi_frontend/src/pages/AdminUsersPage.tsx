import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { userService } from '../services/user.service';
import { api } from '../services/api';
import type { User } from '../types';
import { useTranslation } from 'react-i18next';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '' });
  const { t } = useTranslation();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || t('admin.users.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.users.confirmDelete'))) return;
    setProcessingId(id);
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || t('admin.users.errorDeleting'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditStart = (user: User) => {
    setEditingUser(user);
    setEditForm({ firstName: user.firstName || '', lastName: user.lastName || '', role: user.role });
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setProcessingId(editingUser.id);
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setUsers(prev => prev.map(u => u.id === editingUser.id
        ? { ...u, firstName: editForm.firstName, lastName: editForm.lastName, role: editForm.role as User['role'] }
        : u
      ));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || t('admin.users.errorEditing'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery === '' ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalAdmins = users.filter(u => u.role === 'ROLE_ADMIN').length;
  const totalExecutors = users.filter(u => u.role === 'ROLE_USER').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.users.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('admin.users.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><div className="text-sm font-medium text-gray-600">{t('admin.users.total')}</div><div className="mt-2 text-3xl font-semibold text-gray-900">{users.length}</div></Card>
          <Card><div className="text-sm font-medium text-gray-600">{t('admin.users.admins')}</div><div className="mt-2 text-3xl font-semibold text-purple-600">{totalAdmins}</div></Card>
          <Card><div className="text-sm font-medium text-gray-600">{t('admin.users.executors')}</div><div className="mt-2 text-3xl font-semibold text-green-600">{totalExecutors}</div></Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder={t('admin.users.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div className="flex gap-2">
              {(['all', 'ROLE_ADMIN', 'ROLE_USER'] as const).map(role => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${roleFilter === role ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {role === 'all' ? t('admin.users.filterAll') : role === 'ROLE_ADMIN' ? t('admin.users.filterAdmin') : t('admin.users.filterExecutor')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={loadUsers} className="text-sm font-medium underline">{t('common.retry')}</button>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.users.editUser')}</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.firstName')}</label>
                  <input type="text" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.lastName')}</label>
                  <input type="text" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.role')}</label>
                  <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="ROLE_USER">{t('admin.users.filterExecutor')}</option><option value="ROLE_ADMIN">{t('admin.users.filterAdmin')}</option>
                  </select></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
                <Button onClick={handleEditSave} disabled={processingId === editingUser.id}>{processingId === editingUser.id ? t('common.loading') : t('common.save')}</Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filteredUsers.length === 0 ? (
          <Card><div className="text-center py-12"><p className="text-gray-500 font-medium">{t('admin.users.noUsersFound')}</p></div></Card>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.registeredOn')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold text-sm">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '\u2014'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role === 'ROLE_ADMIN' ? t('admin.users.filterAdmin') : t('admin.users.filterExecutor')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '\u2014'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEditStart(user)} className="text-blue-600 hover:text-blue-900">{t('common.edit')}</button>
                      <button onClick={() => handleDelete(user.id)} disabled={processingId === user.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
