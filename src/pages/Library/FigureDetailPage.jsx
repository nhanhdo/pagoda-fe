import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Modal, message } from 'antd';
import { LeftOutlined, EditOutlined, DeleteOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import { KIND_TONE, figureImg, nextFeast, feastCountdown, bioSectionsOf } from './libraryShared';
import FigureArt from './FigureArt';
import FigureFormModal from './FigureFormModal';
import ChantCounter from './ChantCounter';
import './LibraryPage.css';

const TABS = ['bio', 'vows', 'mantra'];
const paragraphs = (text = '') => text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);

export default function FigureDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const L = t.library;
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'truotri', 'thuki');

  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [chanting, setChanting] = useState(false);
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'bio';
  const tabsRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`/library/${id}`);
      setF(data);
      setFailed(false);
    } catch (err) {
      setF(null);
      setFailed(err?.response?.status !== 404);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const setTab = (key) => {
    const next = new URLSearchParams(params);
    if (key === 'bio') next.delete('tab'); else next.set('tab', key);
    setParams(next, { replace: true, state: location.state });
    // Keep the tab bar in view when switching from further down the page
    const bar = tabsRef.current;
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: L.deleteConfirm,
      okText: t.common.delete,
      cancelText: t.common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/library/${f.id}`);
          message.success(t.common.deleteSuccess);
          navigate('/app/library', { replace: true });
        } catch (err) {
          message.error(err?.response?.data?.message || t.common.error);
        }
      },
    });
  };

  const backBtn = (
    <button type="button" className="lib-d__round" onClick={() => location.state?.libraryList ? navigate(-1) : navigate('/app/library')} aria-label={L.backToLibrary}>
      <LeftOutlined />
    </button>
  );

  if (loading) return <PageSpinner />;
  if (!f) {
    return (
      <div className="lib-d">
        <div className="lib-d__bar">{backBtn}</div>
        <div className="lib-empty">
          <LotusEmpty description={failed ? L.loadError : L.notFound} hint={failed ? '' : L.notFoundHint} />
          {failed && <div style={{ textAlign: 'center', marginTop: 8 }}><Button onClick={() => { setLoading(true); fetchData(); }}>{t.common.retry}</Button></div>}
        </div>
      </div>
    );
  }

  const tone = KIND_TONE[f.kind] || KIND_TONE.phat;
  const img = figureImg(f.image);
  const nf = nextFeast(f.feastDays);
  const sections = bioSectionsOf(f, L);
  const intro = f.intro || (f.bioSections?.length ? '' : f.description) || '';
  const vows = f.vows || [];
  const hasMantra = !!(f.mantraText || f.mantra);
  const mantraText = f.mantraText || f.mantra;
  const dateFmt = lang === 'en' ? 'MMM D' : 'DD/MM';

  const adminMenu = {
    items: [
      { key: 'edit', icon: <EditOutlined />, label: t.common.edit, onClick: () => setEditing(true) },
      { key: 'delete', icon: <DeleteOutlined />, label: t.common.delete, danger: true, onClick: handleDelete },
    ],
  };

  return (
    <div className="lib-d" style={{ '--tone': tone.c, '--tone-soft': tone.s, '--halo': tone.halo }}>
      {/* Soft halo backdrop tinted by the artwork */}
      <div className="lib-d__backdrop" aria-hidden>
        {img && <img src={img} alt="" />}
      </div>

      <div className="lib-d__bar">
        {backBtn}
        <div className="lib-d__bar-right">
          {hasMantra && (
            <button type="button" className="lib-d__round lib-d__round--chant" onClick={() => setChanting(true)} aria-label={L.chant} title={L.chant}>
              <DharmaWheel size={20} />
            </button>
          )}
          {canEdit && (
            <Dropdown menu={adminMenu} trigger={['click']} placement="bottomRight">
              <button type="button" className="lib-d__round" aria-label={L.manage}><MoreOutlined /></button>
            </Dropdown>
          )}
        </div>
      </div>

      <header className="lib-d__head">
        <FigureArt figure={f} className="lib-d__art" />
        <h1 className="lib-d__name">{f.name}</h1>
        {f.title && <div className="lib-d__title">{f.title}</div>}
        <span className="lib-d__rule" aria-hidden />
        {nf?.date && (
          <div className={`lib-d__feast${nf.diff <= 30 ? ' is-soon' : ''}`}>
            <CalendarOutlined /> {nf.label || L.feastDays} · {nf.day}/{nf.month} {L.lunarShort} ({nf.date.format(dateFmt)}) · {feastCountdown(L, nf)}
          </div>
        )}
      </header>

      <div className="lib-d__tabs" ref={tabsRef} role="tablist" aria-label={f.name} onKeyDown={(event) => {
        const index = TABS.indexOf(tab);
        const offsets = { ArrowLeft: -1, ArrowRight: 1 };
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1
          : offsets[event.key] ? (index + offsets[event.key] + TABS.length) % TABS.length : null;
        if (next === null) return;
        event.preventDefault();
        setTab(TABS[next]);
        event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
      }}>
        <div className="lib-d__tabs-track" style={{ '--i': TABS.indexOf(tab) }}>
          <span className="lib-d__tabs-pill" aria-hidden />
          {TABS.map(k => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              id={`library-tab-${k}`}
              aria-controls="library-panel"
              tabIndex={tab === k ? 0 : -1}
              className={`lib-d__tab${tab === k ? ' is-active' : ''}`}
              onClick={() => setTab(k)}
            >
              {L[`tab_${k}`]}
            </button>
          ))}
        </div>
      </div>

      <section className="lib-d__panel" key={tab} role="tabpanel" id="library-panel" aria-labelledby={`library-tab-${tab}`} tabIndex={0}>
        {tab === 'bio' && (
          sections.length || intro ? (
            <div className="lib-bio">
              {paragraphs(intro).map((p, i) => <p key={`i${i}`} className="lib-bio__intro">{p}</p>)}
              {sections.map((s, i) => (
                <div key={i} className="lib-bio__section">
                  {s.heading && <h2 className="lib-bio__heading">{s.heading}</h2>}
                  {paragraphs(s.body).map((p, j) => <p key={j}>{p}</p>)}
                </div>
              ))}
            </div>
          ) : <LotusEmpty compact description={L.emptyBio} />
        )}

        {tab === 'vows' && (
          vows.length ? (
            <div className="lib-vows">
              {f.vowsIntro && <p className="lib-vows__intro">{f.vowsIntro}</p>}
              <ol className="lib-vows__list">
                {vows.map((v, i) => (
                  <li key={i} className="lib-vow">
                    <span className="lib-vow__no">{v.no || i + 1}</span>
                    <p className="lib-vow__text">{v.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : <LotusEmpty compact description={L.emptyVows} />
        )}

        {tab === 'mantra' && (
          hasMantra ? (
            <div className="lib-mantra2">
              <p className="lib-mantra2__text">{mantraText}</p>
              {f.mantraPhonetic && <p className="lib-mantra2__phonetic">{f.mantraPhonetic}</p>}
              {f.mantraMeaning && (
                <>
                  <span className="lib-mantra2__rule" aria-hidden />
                  <div className="lib-mantra2__label">{L.meaning}</div>
                  <p className="lib-mantra2__meaning">{f.mantraMeaning}</p>
                </>
              )}
              <button type="button" className="lib-chant-btn" onClick={() => setChanting(true)}>
                <DharmaWheel size={20} /> {L.chant}
              </button>
            </div>
          ) : <LotusEmpty compact description={L.emptyMantra} />
        )}
      </section>

      <ChantCounter open={chanting} figure={f} onClose={() => setChanting(false)} />

      <FigureFormModal
        open={editing}
        record={f}
        onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); fetchData(); }}
      />
    </div>
  );
}
