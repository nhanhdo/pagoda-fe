import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Input, message, Tooltip, Alert } from 'antd';
import {
  CloudServerOutlined, DownloadOutlined, CloudUploadOutlined, HistoryOutlined,
  UploadOutlined, WarningOutlined, CheckCircleFilled, DatabaseOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import './BackupPage.css';

const CONFIRM_PHRASE = 'KHOI PHUC';

const fmtBytes = (b = 0) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function BackupPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const B = t.backup;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savingCloud, setSavingCloud] = useState(false);
  const [pending, setPending] = useState(null);        // { snapshot, fileName, counts, createdAt }
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const loadStatus = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/backup/status');
      setStatus(data);
    } catch {
      message.error(B.statusError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { loadStatus(); }, []);

  const download = async ({ silent = false } = {}) => {
    setDownloading(true);
    try {
      const res = await api.get('/backup/export', { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const name = /filename="([^"]+)"/.exec(disposition)?.[1] || `quanlychua-backup-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      if (!silent) message.success(B.downloaded);
      return true;
    } catch {
      message.error(B.downloadError);
      return false;
    } finally {
      setDownloading(false);
    }
  };

  const saveCloud = async () => {
    setSavingCloud(true);
    try {
      await api.post('/backup/cloud');
      message.success(B.cloudSaved);
      loadStatus();
    } catch (e) {
      message.error(e.response?.data?.message || B.cloudError);
    } finally {
      setSavingCloud(false);
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const snapshot = JSON.parse(await file.text());
      const { data } = await api.post('/backup/validate', snapshot);
      setConfirmText('');
      const me = (snapshot.tables?.User || []).find(u => u.id === user?.id);
      const keepsMe = !!me && me.role === 'admin' && me.isActive !== false && me.isActive !== 0;
      setPending({ snapshot, fileName: file.name, counts: data.counts || {}, createdAt: data.createdAt, keepsMe });
    } catch (err) {
      message.error(err.response?.data?.message || B.invalidFile);
    }
  };

  const doRestore = async () => {
    setRestoring(true);
    try {
      // Without cloud storage, the safety copy of the current data is saved to this computer first.
      let safetyDownloaded = false;
      if (!status?.cloudEnabled) {
        message.info(B.savingSafety);
        safetyDownloaded = await download({ silent: true });
        if (!safetyDownloaded) { setRestoring(false); return; }
      }
      await api.post('/backup/restore', { confirm: CONFIRM_PHRASE, snapshot: pending.snapshot, safetyDownloaded });
      setPending(null);
      Modal.success({
        title: B.restoredTitle,
        content: B.restoredBody,
        okText: B.reload,
        onOk: () => window.location.reload(),
      });
    } catch (err) {
      message.error(err.response?.data?.message || B.restoreError);
    } finally {
      setRestoring(false);
    }
  };

  if (loading) return <PageSpinner />;

  const counts = status?.counts || {};
  const totalRows = Object.values(counts).reduce((s, n) => s + n, 0);
  const copies = status?.cloudCopies || [];
  const latest = copies[0];

  return (
    <div className="bk-page">
      <section className="bk-hero section-anim section-d0">
        <div className="bk-hero__main">
          <div className="bk-hero__icon"><CloudServerOutlined /></div>
          <div>
            <h1 className="bk-hero__title">{B.title}</h1>
            <p className="bk-hero__sub">{B.subtitle}</p>
          </div>
        </div>
        <div className={`bk-health${latest ? ' is-ok' : ' is-warn'}`}>
          {latest ? <CheckCircleFilled /> : <WarningOutlined />}
          <div>
            <strong>{latest ? B.lastBackup : B.noBackupYet}</strong>
            <span>{latest ? `${dayjs(latest.createdAt).format('DD/MM/YYYY HH:mm')} · ${dayjs(latest.createdAt).fromNow()}` : B.noBackupHint}</span>
          </div>
        </div>
      </section>

      <div className="bk-grid section-anim section-d1">
        {/* Manual backup */}
        <section className="bk-card">
          <header className="bk-card__head"><span className="bk-card__icon"><DownloadOutlined /></span>{B.manualTitle}</header>
          <p className="bk-card__text">{B.manualText}</p>
          <div className="bk-actions">
            <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={() => download()} className="bk-btn">{B.download}</Button>
            <Tooltip title={status?.cloudEnabled ? '' : B.cloudDisabled}>
              <Button icon={<CloudUploadOutlined />} loading={savingCloud} disabled={!status?.cloudEnabled} onClick={saveCloud} className="bk-btn">{B.saveCloud}</Button>
            </Tooltip>
          </div>
          <div className="bk-note"><WarningOutlined /> {B.sensitiveNote}</div>
        </section>

        {/* Data summary */}
        <section className="bk-card">
          <header className="bk-card__head">
            <span className="bk-card__icon"><DatabaseOutlined /></span>{B.dataTitle}
            <span className="bk-card__badge">{totalRows} {B.records}</span>
          </header>
          <ul className="bk-counts">
            {Object.entries(counts).map(([table, n]) => (
              <li key={table}><span>{B.tables[table] || table}</span><strong>{n}</strong></li>
            ))}
          </ul>
          <div className="bk-dialect">{B.database}: <strong>{status?.dialect === 'postgres' ? 'PostgreSQL' : 'SQLite'}</strong></div>
        </section>
      </div>

      {/* Automatic cloud copies */}
      <section className="bk-card section-anim section-d2">
        <header className="bk-card__head">
          <span className="bk-card__icon"><HistoryOutlined /></span>{B.autoTitle}
          <Tooltip title={B.refreshList}>
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={loadStatus} loading={refreshing} aria-label={B.refreshList} style={{ marginLeft: 'auto' }} />
          </Tooltip>
        </header>
        {!status?.cloudEnabled ? (
          <Alert type="warning" showIcon message={B.cloudDisabled} description={B.cloudDisabledHint} />
        ) : status?.cloudError ? (
          <Alert type="error" showIcon message={B.cloudError} description={status.cloudError} />
        ) : copies.length === 0 ? (
          <LotusEmpty description={B.noCopies} hint={B.noCopiesHint} />
        ) : (
          <ul className="bk-list">
            {copies.map(c => {
              const kind = c.kind === 'before-restore' ? 'safety' : (c.kind || 'auto');
              return (
                <li key={c.publicId} className="bk-list__row">
                  <span className={`bk-kind bk-kind--${kind}`}>{B.kinds[kind]}</span>
                  <div className="bk-list__info">
                    <strong>{dayjs(c.createdAt).format('DD/MM/YYYY HH:mm')}</strong>
                    <span>{dayjs(c.createdAt).fromNow()} · {fmtBytes(c.bytes)}</span>
                  </div>
                  <Button size="small" icon={<DownloadOutlined />} href={c.url} target="_blank" rel="noreferrer">{B.downloadShort}</Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Restore */}
      <section className="bk-card bk-card--danger section-anim section-d3">
        <header className="bk-card__head"><span className="bk-card__icon"><UploadOutlined /></span>{B.restoreTitle}</header>
        <p className="bk-card__text">{B.restoreText}</p>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickFile} />
        <Button danger icon={<UploadOutlined />} onClick={() => fileRef.current?.click()} className="bk-btn">{B.chooseFile}</Button>
      </section>

      <Modal
        open={!!pending}
        title={<span><WarningOutlined style={{ color: '#d9646c', marginRight: 8 }} />{B.confirmTitle}</span>}
        onCancel={() => !restoring && setPending(null)}
        okText={B.confirmOk}
        cancelText={t.common.cancel}
        okButtonProps={{ danger: true, disabled: confirmText.trim().toUpperCase() !== CONFIRM_PHRASE, loading: restoring }}
        onOk={doRestore}
        destroyOnClose
      >
        {pending && (
          <div className="bk-confirm">
            <p>{B.confirmIntro}</p>
            <div className="bk-confirm__file">
              <div><span>{B.file}</span><strong>{pending.fileName}</strong></div>
              <div><span>{B.createdAt}</span><strong>{pending.createdAt ? dayjs(pending.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</strong></div>
              <div><span>{B.records}</span><strong>{Object.values(pending.counts).reduce((s, n) => s + n, 0)}</strong></div>
            </div>
            <Alert type="error" showIcon message={B.confirmWarning} style={{ margin: '12px 0' }} />
            {!pending.keepsMe && <Alert type="warning" showIcon message={B.selfMissing} style={{ marginBottom: 12 }} />}
            {!status?.cloudEnabled && <Alert type="info" showIcon message={B.safetyLocal} style={{ marginBottom: 12 }} />}
            <p style={{ marginBottom: 6 }}>{B.typeToConfirm.replace('{phrase}', CONFIRM_PHRASE)}</p>
            <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={CONFIRM_PHRASE} autoFocus />
          </div>
        )}
      </Modal>
    </div>
  );
}
