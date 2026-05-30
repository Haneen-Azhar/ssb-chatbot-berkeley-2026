'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import styles from './campus-memory.module.css';

let supabase = null;
if (typeof window !== 'undefined') {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// File type badge colors
const FILE_TYPE_COLORS = {
  csv: { bg: '#dcfce7', color: '#166534' },
  txt: { bg: '#dbeafe', color: '#1e40af' },
  pdf: { bg: '#fee2e2', color: '#991b1b' },
  xlsx: { bg: '#ffedd5', color: '#9a3412' },
  ods: { bg: '#ffedd5', color: '#9a3412' },
};

function getTypeBadgeStyle(fileType) {
  const t = (fileType || '').toLowerCase();
  const colors = FILE_TYPE_COLORS[t] || { bg: '#f3f4f6', color: '#374151' };
  return { backgroundColor: colors.bg, color: colors.color };
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export default function CampusMemoryPage() {
  const router = useRouter();

  // Auth
  const [userEmail, setUserEmail] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Data
  const [textBlock, setTextBlock] = useState(null); // existing text_block memory or null
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null); // { name, type, content, needsPaste }
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ---- Fetch helper ----
  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed: ' + res.status);
      }
      return res.json();
    },
    [accessToken]
  );

  // ---- Auth gate ----
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUserEmail(data.session.user.email);
      setAccessToken(data.session.access_token);
      setAuthChecked(true);
    }
    init();
  }, [router]);

  // ---- Load data ----
  const loadMemories = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/campus-memory');
      const memories = data.memories || [];

      const tb = memories.find((m) => m.memory_type === 'text_block');
      setTextBlock(tb || null);
      setTextContent(tb ? tb.content : '');

      const fileMemories = memories.filter((m) => m.memory_type === 'file');
      setFiles(fileMemories);
    } catch (err) {
      console.error('Failed to load campus memories:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!authChecked || !accessToken) return;
    loadMemories();
  }, [authChecked, accessToken, loadMemories]);

  // ---- Save text block ----
  async function handleSaveTextBlock() {
    setSaving(true);
    try {
      if (textBlock) {
        await fetchWithAuth('/api/campus-memory', {
          method: 'PUT',
          body: JSON.stringify({
            id: textBlock.id,
            title: 'General Campus Notes',
            content: textContent,
          }),
        });
      } else {
        await fetchWithAuth('/api/campus-memory', {
          method: 'POST',
          body: JSON.stringify({
            type: 'text_block',
            title: 'General Campus Notes',
            content: textContent,
          }),
        });
      }
      showToast('Campus notes saved');
      await loadMemories();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ---- File handling ----
  async function handleFileSelect(file) {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    setUploadTitle(baseName);

    if (ext === 'pdf') {
      setUploadFile({ name: file.name, type: ext, content: '', needsPaste: true });
      setUploadContent('');
      return;
    }

    // Send to server for parsing (handles CSV, TXT, XLSX, ODS)
    try {
      setUploadFile({ name: file.name, type: ext, content: '', needsPaste: false });
      setUploadContent('Parsing file...');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-file', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setUploadContent('');
        showToast(err.error || 'Failed to parse file', 'error');
        return;
      }

      const data = await res.json();
      setUploadFile({ name: data.fileName, type: data.fileType, content: data.content, needsPaste: false });
      setUploadContent(data.content);
    } catch (err) {
      console.error('File parse error:', err);
      setUploadContent('');
      showToast('Failed to parse file', 'error');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function cancelUpload() {
    setUploadFile(null);
    setUploadTitle('');
    setUploadContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload() {
    if (!uploadTitle.trim() || !uploadContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }
    setUploading(true);
    try {
      await fetchWithAuth('/api/campus-memory', {
        method: 'POST',
        body: JSON.stringify({
          type: 'file',
          title: uploadTitle.trim(),
          content: uploadContent,
          fileName: uploadFile?.name || '',
          fileType: uploadFile?.type || 'txt',
        }),
      });
      showToast('File uploaded successfully');
      cancelUpload();
      await loadMemories();
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  }

  // ---- Edit modal ----
  function openEdit(item) {
    setEditItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
  }

  function closeEdit() {
    setEditItem(null);
    setEditTitle('');
    setEditContent('');
  }

  async function handleEditSave() {
    if (!editTitle.trim() || !editContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }
    setEditSaving(true);
    try {
      await fetchWithAuth('/api/campus-memory', {
        method: 'PUT',
        body: JSON.stringify({
          id: editItem.id,
          title: editTitle.trim(),
          content: editContent,
        }),
      });
      showToast('Document updated');
      closeEdit();
      await loadMemories();
    } catch (err) {
      console.error('Edit save error:', err);
      showToast('Failed to update document', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  // ---- Delete ----
  async function handleDelete() {
    setDeleting(true);
    try {
      await fetchWithAuth('/api/campus-memory?id=' + deleteId, {
        method: 'DELETE',
      });
      showToast('Document deleted');
      setDeleteId(null);
      await loadMemories();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete document', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // ---- Render guards ----
  if (!authChecked) return null;

  if (loading) {
    return <div className={styles.loading}>Loading campus memory...</div>;
  }

  // ---- Page ----
  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <h1>Campus Information</h1>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{userEmail}</span>
          <Link href="/">Back to Chat</Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Text Block Section */}
        <section className={styles.textBlockSection}>
          <h2 className={styles.sectionTitle}>General Campus Notes</h2>
          <p className={styles.sectionDescription}>
            Free-form notes that supplement the chatbot&apos;s knowledge base. Add local contacts, building info, dining details, or special instructions.
          </p>
          <textarea
            className={styles.textarea}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Add any campus-specific information here: local contacts, building info, dining details, special instructions..."
            rows={6}
          />
          <div className={styles.textBlockActions}>
            <button
              className={styles.btnPrimary}
              onClick={handleSaveTextBlock}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {textBlock && (
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Last saved {formatDate(textBlock.updated_at || textBlock.created_at)}
              </span>
            )}
          </div>
        </section>

        {/* Uploaded Documents Section */}
        <section className={styles.filesSection}>
          <h2 className={styles.sectionTitle}>Uploaded Documents</h2>
          <p className={styles.sectionDescription}>
            Upload CSV, TXT, or PDF files to add structured data to the chatbot&apos;s context.
          </p>

          {/* Drop zone (hide when previewing an upload) */}
          {!uploadFile && (
            <div
              className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropZoneIcon}>&#128196;</div>
              <div className={styles.dropZoneText}>
                Drag and drop a file here, or{' '}
                <span className={styles.chooseBtn}>choose a file</span>
              </div>
              <div className={styles.dropZoneFormats}>
                Accepted formats: XLSX, CSV, TXT, ODS, PDF
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,.xlsx,.ods"
                className={styles.fileInput}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginTop: '14px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: '16px', lineHeight: '1.4' }}>&#128161;</span>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Keep the chatbot up to date with:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {['Master schedule', 'Rooming lists', 'Mentor lists', 'Campus tracker'].map((item) => (
                  <span key={item} style={{
                    padding: '3px 10px',
                    background: '#e2e8f0',
                    borderRadius: '100px',
                    fontSize: '12px',
                    color: '#334155',
                    fontWeight: 500,
                  }}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Upload preview */}
          {uploadFile && (
            <div className={styles.uploadPreview}>
              <div className={styles.uploadPreviewHeader}>
                <span className={styles.uploadPreviewTitle}>
                  New upload: {uploadFile.name}
                </span>
                <span
                  className={styles.badge}
                  style={getTypeBadgeStyle(uploadFile.type)}
                >
                  {uploadFile.type}
                </span>
              </div>

              <input
                className={styles.titleInput}
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Document title"
              />

              {uploadFile.needsPaste && uploadFile.type === 'pdf' && (
                <div className={styles.xlsxMessage}>
                  PDF files cannot be read directly in the browser. Please paste the text content from this PDF into the text area below.
                </div>
              )}

              <textarea
                className={styles.textarea}
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder={
                  uploadFile.needsPaste
                    ? 'Paste the text content from the PDF here...'
                    : 'Review and edit the content before saving...'
                }
                rows={10}
              />

              <div className={styles.uploadPreviewActions}>
                <button
                  className={styles.btnGold}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button className={styles.btnCancel} onClick={cancelUpload}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* File cards */}
          {files.length > 0 ? (
            <div className={styles.fileCards}>
              {files.map((file) => (
                <div key={file.id} className={styles.fileCard}>
                  <div className={styles.fileCardHeader}>
                    <span className={styles.fileCardTitle}>{file.title}</span>
                    <span
                      className={styles.badge}
                      style={getTypeBadgeStyle(file.file_type)}
                    >
                      {file.file_type || 'txt'}
                    </span>
                  </div>
                  <div className={styles.fileCardDate}>
                    Uploaded {formatDate(file.created_at)}
                  </div>
                  <div className={styles.fileCardPreview}>
                    {truncate(file.content, 200)}
                  </div>
                  <div className={styles.fileCardActions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => openEdit(file)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => setDeleteId(file.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !uploadFile && (
              <div className={styles.emptyState}>
                No documents uploaded yet. Drag a file above or click to upload.
              </div>
            )
          )}
        </section>
      </main>

      {/* Edit modal */}
      {editItem && (
        <div className={styles.modalOverlay} onClick={closeEdit}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Document</h3>
            <input
              className={styles.titleInput}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Document title"
            />
            <textarea
              className={styles.textarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeEdit}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmTitle}>Delete Document</div>
            <div className={styles.confirmMessage}>
              This will permanently remove this document from the chatbot&apos;s memory. This cannot be undone.
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.btnDelete}
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '9px 20px', fontSize: '0.875rem' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === 'error' ? styles.toastError : styles.toastSuccess
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
