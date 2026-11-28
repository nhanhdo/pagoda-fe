import React, { useCallback, useEffect, useState } from 'react';
import { Button, Tabs, message } from 'antd';
import {
  AccountBookOutlined, PlusOutlined, PieChartOutlined, FileTextOutlined, BookOutlined, BankOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import FinanceOverview from './FinanceOverview';
import ExpensesTab from './ExpensesTab';
import LedgerTab from './LedgerTab';
import FundsTab from './FundsTab';
import './FinancePage.css';

const TABS = ['overview', 'expenses', 'ledger', 'funds'];

export default function FinancePage() {
  const { t } = useLanguage();
  const F = t.finance;
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const qTab = params.get('tab');
  const focusExpenseId = params.get('expense');

  const [tab, setTab] = useState(TABS.includes(qTab) && (qTab !== 'funds' || admin) ? qTab : 'overview');
  const [funds, setFunds] = useState([]);
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [fundId, setFundId] = useState(undefined);
  const [createSignal, setCreateSignal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadFunds = useCallback(async () => {
    try {
      const { data } = await api.get('/funds');
      setFunds(data);
    } catch {
      message.error(F.loadError);
    }
  }, [F.loadError]);
  useEffect(() => { loadFunds(); }, [loadFunds, refreshKey]);

  // Deep link from notifications: ?tab=expenses&expense=<id>
  useEffect(() => {
    if (qTab && TABS.includes(qTab) && (qTab !== 'funds' || admin)) setTab(qTab);
  }, [location.key]);
  useEffect(() => {
    if (!location.search) return undefined;
    const id = setTimeout(() => navigate(location.pathname, { replace: true }), 3000);
    return () => clearTimeout(id);
  }, [location.key]);

  const changed = () => setRefreshKey(k => k + 1);
  const activeFunds = funds.filter(f => f.isActive !== false);

  const items = [
    { key: 'overview', label: <span><PieChartOutlined />{F.tabs.overview}</span> },
    { key: 'expenses', label: <span><FileTextOutlined />{F.tabs.expenses}</span> },
    { key: 'ledger',   label: <span><BookOutlined />{F.tabs.ledger}</span> },
    ...(admin ? [{ key: 'funds', label: <span><BankOutlined />{F.tabs.funds}</span> }] : []),
  ];

  return (
    <div className="fin-page">
      <section className="fin-hero section-anim section-d0">
        <div className="fin-hero__main">
          <div className="fin-hero__icon"><AccountBookOutlined /></div>
          <div>
            <h1 className="fin-hero__title">{F.title}</h1>
            <p className="fin-hero__sub">{F.subtitle}</p>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="add-action fin-btn" onClick={() => { setTab('expenses'); setCreateSignal(s => s + 1); }}>
          {F.addExpense}
        </Button>
      </section>

      <div className="fin-tabs section-anim section-d1">
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </div>

      <div className="fin-content">
        {tab === 'overview' && (
          <FinanceOverview F={F} funds={funds} range={range} setRange={setRange} fundId={fundId} setFundId={setFundId} refreshKey={refreshKey} />
        )}
        {tab === 'expenses' && (
          <ExpensesTab
            F={F} t={t} admin={admin} funds={activeFunds} allFunds={funds}
            createSignal={createSignal} onCreateHandled={() => setCreateSignal(0)} onChanged={changed} focusExpenseId={focusExpenseId} focusKey={location.key}
          />
        )}
        {tab === 'ledger' && <LedgerTab F={F} funds={funds} refreshKey={refreshKey} />}
        {tab === 'funds' && admin && <FundsTab F={F} funds={funds} onChanged={changed} />}
      </div>
    </div>
  );
}
