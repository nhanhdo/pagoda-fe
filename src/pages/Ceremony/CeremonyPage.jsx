import React, { useCallback, useEffect, useState } from 'react';
import { Button, Tabs, Tooltip, message } from 'antd';
import { FireOutlined, PlusOutlined, CalendarOutlined, SolutionOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CeremoniesTab from './CeremoniesTab';
import RegistrationsTab from './RegistrationsTab';
import TabletsTab from './TabletsTab';
import { daysUntil } from './ceremonyShared';
import './CeremonyPage.css';

const TABS = ['ceremonies', 'registrations', 'tablets'];

export default function CeremonyPage() {
  const { t, lang } = useLanguage();
  const C = t.ceremony;
  const { isAdmin, hasRole } = useAuth();
  const canWrite = isAdmin() || hasRole('truotri') || hasRole('thuki') || hasRole('truongban');
  const canCreateCeremony = hasRole('admin', 'thuki');
  const canCreateTablet = hasRole('admin', 'thuki');
  const canRemove = isAdmin() || hasRole('truotri');
  const admin = isAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const qTab = new URLSearchParams(location.search).get('tab');

  const [tab, setTab] = useState(TABS.includes(qTab) ? qTab : 'ceremonies');
  const [ceremonies, setCeremonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [funds, setFunds] = useState([]);
  const [createSignal, setCreateSignal] = useState(0);

  const loadCeremonies = useCallback(async () => {
    try {
      const { data } = await api.get('/ceremonies');
      setCeremonies(data);
      setSelectedId(cur => {
        if (cur && data.some(c => c.id === cur)) return cur;
        const upcoming = data.filter(c => (daysUntil(c.solarDate) ?? -1) >= 0);
        return (upcoming[0] || data[data.length - 1])?.id ?? null;
      });
    } catch {
      message.error(C.loadError);
    } finally {
      setLoading(false);
    }
  }, [C.loadError]);

  useEffect(() => { loadCeremonies(); }, [loadCeremonies]);
  // Funds are finance-restricted; roles without access simply use the ceremony's default fund.
  useEffect(() => { api.get('/funds').then(r => setFunds((r.data || []).filter(f => f.isActive !== false))).catch(() => setFunds([])); }, []);
  useEffect(() => { if (qTab && TABS.includes(qTab)) setTab(qTab); }, [location.key]);
  useEffect(() => {
    if (!location.search) return undefined;
    const id = setTimeout(() => navigate(location.pathname, { replace: true }), 3000);
    return () => clearTimeout(id);
  }, [location.key]);

  if (loading) return <PageSpinner />;

  const openRegistrations = (id) => { setSelectedId(id); setTab('registrations'); };
  const selectedCeremony = ceremonies.find(c => c.id === selectedId);
  const canCreateRegistration = canWrite && selectedCeremony &&
    (selectedCeremony.ceremonyType !== 'cầu_siêu' || canCreateCeremony);
  const canShowCreate = { ceremonies: canCreateCeremony, registrations: canCreateRegistration, tablets: canCreateTablet }[tab];
  const heroAction = {
    ceremonies: C.addCeremony,
    registrations: C.addRegistration,
    tablets: C.addTablet,
  }[tab];

  const items = [
    { key: 'ceremonies', label: <span><CalendarOutlined />{C.tabs.ceremonies}</span> },
    { key: 'registrations', label: <span><SolutionOutlined />{C.tabs.registrations}</span> },
    { key: 'tablets', label: <span><AppstoreOutlined />{C.tabs.tablets}</span> },
  ];

  return (
    <div className="cer-page">
      <section className="cer-hero section-anim section-d0">
        <div className="cer-hero__main">
          <div className="cer-hero__icon"><FireOutlined /></div>
          <div>
            <h1 className="cer-hero__title">{C.title}</h1>
            <p className="cer-hero__sub">{C.subtitle}</p>
          </div>
        </div>
        {canShowCreate && (() => {
          const locked = tab === 'registrations' && !selectedCeremony.registrationOpen && !admin;
          return (
            <Tooltip title={locked ? C.closedForRegistration : ''}>
              <Button type="primary" icon={<PlusOutlined />} className="add-action cer-btn" disabled={locked} onClick={() => setCreateSignal(s => s + 1)}>
                {heroAction}
              </Button>
            </Tooltip>
          );
        })()}
      </section>

      <div className="cer-tabs section-anim section-d1">
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </div>

      <div className="cer-content">
        {tab === 'ceremonies' && (
          <CeremoniesTab
            C={C} t={t} lang={lang} ceremonies={ceremonies} funds={funds}
            canWrite={canWrite} canCreate={canCreateCeremony} canRemove={canRemove} createSignal={createSignal}
            onChanged={loadCeremonies} onOpenRegistrations={openRegistrations}
          />
        )}
        {tab === 'registrations' && (
          <RegistrationsTab
            C={C} t={t} lang={lang} ceremonies={ceremonies} funds={funds}
            selectedId={selectedId} setSelectedId={setSelectedId}
            canWrite={canWrite} canAddSpirit={canCreateCeremony} canRemove={canRemove} isAdmin={admin} createSignal={createSignal} onChanged={loadCeremonies}
          />
        )}
        {tab === 'tablets' && (
          <TabletsTab C={C} t={t} canCreate={canCreateTablet} canWrite={canWrite} canRemove={canRemove} createSignal={createSignal} />
        )}
      </div>
    </div>
  );
}
