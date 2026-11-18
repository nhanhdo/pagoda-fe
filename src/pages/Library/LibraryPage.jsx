import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Segmented } from 'antd';
import { PlusOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import { useCreateParam } from '../../utils/useCreateParam';
import { KIND_TONE, nextFeast, feastCountdown } from './libraryShared';
import FigureArt from './FigureArt';
import FigureFormModal from './FigureFormModal';
import '../Personnel/peopleShared.css';
import './LibraryPage.css';

const SOON_DAYS = 30;

export default function LibraryPage() {
  const { t } = useLanguage();
  const L = t.library;
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'truotri', 'thuki');
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [form, setForm] = useState({ open: false, record: null });

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/library');
      setItems(Array.isArray(data) ? data : []);
      setFailed(false);
    } catch {
      // Show an error state with Retry — not "the library is empty"
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);
  useCreateParam(() => setForm({ open: true, record: null }), canEdit);

  const openDetail = (id) => navigate(`/app/library/${id}`);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(f => {
      if (kind !== 'all' && f.kind !== kind) return false;
      if (!q) return true;
      return [f.name, f.title, f.mantraText, f.mantraPhonetic, f.otherNames, f.mantra].some(v => v?.toLowerCase().includes(q));
    });
  }, [items, query, kind]);

  const counts = useMemo(() => ({
    all: items.length,
    phat: items.filter(f => f.kind === 'phat').length,
    bo_tat: items.filter(f => f.kind === 'bo_tat').length,
    thanh_tang: items.filter(f => f.kind === 'thanh_tang').length,
  }), [items]);

  const upcoming = useMemo(() => items
    .map(f => ({ f, nf: nextFeast(f.feastDays) }))
    .filter(x => x.nf && x.nf.diff != null && x.nf.diff <= SOON_DAYS)
    .sort((a, b) => a.nf.diff - b.nf.diff)
    .slice(0, 3), [items]);

  if (loading) return <PageSpinner />;

  return (
    <div className="pp-page lib-page">
      <section className="pp-hero lib-hero section-anim section-d0">
        <div className="pp-hero__main">
          <div className="pp-hero__icon"><DharmaWheel size={26} /></div>
          <div>
            <h1 className="pp-hero__title">{L.title}</h1>
            <p className="pp-hero__sub">{L.subtitle}</p>
          </div>
        </div>
        {canEdit && (
          <div className="pp-hero__actions">
            <Button type="primary" icon={<PlusOutlined />} className="pp-hero__btn" onClick={() => setForm({ open: true, record: null })}>
              {L.addNew}
            </Button>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="lib-soon section-anim section-d1" aria-label={L.upcomingTitle}>
          <span className="lib-soon__label"><CalendarOutlined /> {L.upcomingTitle}</span>
          {upcoming.map(({ f, nf }) => (
            <button key={f.id} type="button" className="lib-soon__chip" onClick={() => openDetail(f.id)}>
              <strong>{f.name}</strong>
              <span>{nf.label ? `${nf.label} · ` : ''}{feastCountdown(L, nf)}</span>
            </button>
          ))}
        </section>
      )}

      <section className="lib-toolbar section-anim section-d1">
        <Input
          className="lib-search"
          prefix={<SearchOutlined style={{ color: '#7a6a5c' }} />}
          placeholder={L.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          allowClear
        />
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: `${L.all} · ${counts.all}` },
            { value: 'phat', label: `${L.kinds.phat} · ${counts.phat}` },
            { value: 'bo_tat', label: `${L.kinds.bo_tat} · ${counts.bo_tat}` },
            ...(counts.thanh_tang ? [{ value: 'thanh_tang', label: `${L.kinds.thanh_tang} · ${counts.thanh_tang}` }] : []),
          ]}
        />
      </section>

      {failed && !items.length ? (
        <div className="lib-empty">
          <LotusEmpty description={L.loadError} hint={L.loadErrorHint} />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button onClick={() => { setLoading(true); fetchData(); }}>{t.common.retry}</Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lib-empty">
          {items.length === 0
            ? <LotusEmpty description={L.emptyTitle} hint={canEdit ? L.emptyHint : ''} />
            : <LotusEmpty description={L.emptyFiltered} hint={L.emptyFilteredHint} />}
        </div>
      ) : (
        <ul className="lib-grid section-anim section-d2">
          {filtered.map(f => {
            const nf = nextFeast(f.feastDays);
            const soon = nf && nf.diff != null && nf.diff <= SOON_DAYS;
            const tone = KIND_TONE[f.kind] || KIND_TONE.phat;
            return (
              <li key={f.id}>
                <button type="button" className="lib-card" onClick={() => openDetail(f.id)} aria-label={f.name}>
                  <FigureArt figure={f} className="lib-card__art" />
                  <span className="lib-card__kind" style={{ color: tone.c, background: tone.s }}>{L.kinds[f.kind] || f.kind}</span>
                  {soon && <span className={`lib-card__feast${nf.diff === 0 ? ' is-today' : ''}`}>{feastCountdown(L, nf)}</span>}
                  <span className="lib-card__foot">
                    <span className="lib-card__name">{f.name}</span>
                    {f.title && <span className="lib-card__title">{f.title}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <FigureFormModal
        open={form.open}
        record={form.record}
        onClose={() => setForm({ open: false, record: null })}
        onSaved={(saved) => {
          setForm({ open: false, record: null });
          fetchData();
          if (saved?.id) openDetail(saved.id);
        }}
      />
    </div>
  );
}
