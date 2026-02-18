import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface ContentItem {
  id: number;
  title: string;
  body: string;
  type: string;
  published: boolean;
  createdAt: string;
}

export const AdminContentPage: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ title: '', body: '', type: 'article', published: true });
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ContentItem[]>('/admin/content/');
      setItems(res.data);
    } catch (err: any) {
      setError(err.message || t('admin.content.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ title: '', body: '', type: 'article', published: true });
    setShowModal(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setForm({ title: item.title, body: item.body, type: item.type, published: item.published });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/admin/content/${editingItem.id}`, form);
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...form } : i));
      } else {
        const res = await api.post<ContentItem>('/admin/content/', form);
        setItems(prev => [...prev, res.data]);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || t('admin.content.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.content.confirmDelete'))) return;
    try {
      await api.delete(`/admin/content/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert(err.message || t('admin.content.errorDeleting'));
    }
  };

  const togglePublish = async (item: ContentItem) => {
    try {
      await api.put(`/admin/content/${item.id}`, { ...item, published: !item.published });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, published: !i.published } : i));
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  const types = [...new Set(items.map(i => i.type))];
  const filtered = items.filter(i => {
    const matchesType = typeFilter === 'all' || i.type === typeFilter;
    const matchesSearch = searchQuery === '' || i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.content.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('admin.content.subtitle')}</p>
          </div>
          <Button onClick={openCreate}>{t('admin.content.newContent')}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><div className="text-sm text-gray-600">{t('admin.content.total')}</div><div className="mt-1 text-2xl font-bold text-gray-900">{items.length}</div></Card>
          <Card><div className="text-sm text-gray-600">{t('admin.content.published')}</div><div className="mt-1 text-2xl font-bold text-green-600">{items.filter(i => i.published).length}</div></Card>
          <Card><div className="text-sm text-gray-600">{t('admin.content.draft')}</div><div className="mt-1 text-2xl font-bold text-yellow-600">{items.filter(i => !i.published).length}</div></Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder={t('admin.content.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setTypeFilter('all')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t('admin.users.filterAll')}</button>
              {types.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span><button onClick={load} className="text-sm font-medium underline">{t('common.retry')}</button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{editingItem ? t('admin.content.editContent') : t('admin.content.newContentTitle')}</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.content.contentTitle')}</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.content.contentType')}</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="article">{t('admin.content.typeArticle')}</option><option value="announcement">{t('admin.content.typeAnnouncement')}</option><option value="faq">{t('admin.content.typeFaq')}</option><option value="guide">{t('admin.content.typeGuide')}</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.content.contentBody')}</label>
                  <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{t('admin.content.publishNow')}</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
                <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <Card><div className="text-center py-12"><p className="text-gray-500">{t('admin.content.noContent')}</p></div></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{item.title}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{item.type}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.published ? t('admin.content.published') : t('admin.content.draft')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.body}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => togglePublish(item)} className="text-sm text-gray-500 hover:text-gray-700">{item.published ? t('common.unpublish') : t('common.publish')}</button>
                    <button onClick={() => openEdit(item)} className="text-sm text-blue-600 hover:text-blue-800">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:text-red-800">{t('common.delete')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
