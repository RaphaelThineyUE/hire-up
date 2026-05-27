'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Pencil, Trash2, Zap, FileText, Loader2, Download, Plus, Mail, X } from 'lucide-react'
import { Chip } from './Chip'
import { ScoreBadge } from './ScoreBadge'
import { ApplicationForm } from './ApplicationForm'
import { deleteApplication } from '@/actions/applications'
import { scoreApplication, generateDocumentForApplication, listDocuments, deleteDocument } from '@/actions/documents'
import { listContacts, createContact, deleteContact } from '@/actions/scan'
import type { Application, AppDocument, Contact } from '@/lib/types'

interface ApplicationDetailProps {
  application: Application
  onClose?: () => void
  fullPage?: boolean
}

export function ApplicationDetail({ application: app, onClose, fullPage = false }: ApplicationDetailProps) {
  const [editing, setEditing] = useState(false)
  const [scoring, startScore] = useTransition()
  const [generating, startGenerate] = useTransition()
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<AppDocument[]>([])
  const [currentScore, setCurrentScore] = useState(app.match_score_value)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '' })
  const [savingContact, startSaveContact] = useTransition()
  const [outreachPending, setOutreachPending] = useState<string | null>(null)

  useEffect(() => {
    if (fullPage) {
      listDocuments(app.id).then(setDocuments)
      listContacts(app.id).then(setContacts)
    }
  }, [app.id, fullPage])

  async function handleDelete() {
    if (!confirm(`Remove application to ${app.company}?`)) return
    await deleteApplication(app.id)
    onClose?.()
  }

  function handleScore() {
    if (!app.job_description) { setScoreError('No job description — add one first.'); return }
    setScoreError(null)
    startScore(async () => {
      const result = await scoreApplication(app.id, app.job_description!)
      if ('error' in result) setScoreError(result.error)
      else setCurrentScore(result.score)
    })
  }

  function handleGenerate(type: 'cover_letter' | 'tailored_cv') {
    if (!app.job_description) { setGenError('No job description — add one first.'); return }
    setGenError(null)
    startGenerate(async () => {
      const result = await generateDocumentForApplication(app.id, app.job_description!, type)
      if ('error' in result) {
        setGenError(result.error)
      } else {
        const updated = await listDocuments(app.id)
        setDocuments(updated)
      }
    })
  }

  async function handleDeleteDocument(docId: string) {
    await deleteDocument(docId, app.id)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  function handleSaveContact() {
    if (!newContact.name.trim()) return
    startSaveContact(async () => {
      const contact = await createContact(app.id, {
        name: newContact.name.trim() || undefined,
        role: newContact.role.trim() || undefined,
        email: newContact.email.trim() || undefined,
      })
      setContacts(prev => [...prev, contact])
      setNewContact({ name: '', role: '', email: '' })
      setAddingContact(false)
    })
  }

  async function handleDeleteContact(contactId: string) {
    await deleteContact(contactId)
    setContacts(prev => prev.filter(c => c.id !== contactId))
  }

  async function handleDraftOutreach(contact: Contact) {
    if (!app.job_description) { setGenError('No job description — add one first.'); return }
    setGenError(null)
    setOutreachPending(contact.id)
    const contactStr = [contact.name, contact.role].filter(Boolean).join(', ')
    const result = await generateDocumentForApplication(app.id, app.job_description, 'outreach_email', contactStr)
    setOutreachPending(null)
    if ('error' in result) setGenError(result.error)
    else setDocuments(await listDocuments(app.id))
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }
  const fieldLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)',
  }
  const fieldValue: React.CSSProperties = { fontSize: 13, color: 'var(--fg-0)' }
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--fg-3)',
  }

  if (editing) {
    return <ApplicationForm mode="edit" initial={app} onDone={() => setEditing(false)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--fg-0)' }}>
              {app.role}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)' }}>{app.company}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-1)' }}>
              <Pencil size={13} strokeWidth={1.75} /> Edit
            </button>
            <button onClick={handleDelete} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--danger)' }}>
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip status={app.status} />
          <ScoreBadge value={currentScore} />
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none' }}>
              <ExternalLink size={12} strokeWidth={1.75} /> Job posting
            </a>
          )}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {app.location && <div style={fieldStyle}><span style={fieldLabel}>Location</span><span style={fieldValue}>{app.location}</span></div>}
        {app.remote_type && <div style={fieldStyle}><span style={fieldLabel}>Remote</span><span style={{ ...fieldValue, textTransform: 'capitalize' }}>{app.remote_type}</span></div>}
        {app.contract_type && <div style={fieldStyle}><span style={fieldLabel}>Contract</span><span style={{ ...fieldValue, textTransform: 'capitalize' }}>{app.contract_type}</span></div>}
        {app.salary_range && <div style={fieldStyle}><span style={fieldLabel}>Salary</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)' }}>{app.salary_range}</span></div>}
        {app.source_board && <div style={fieldStyle}><span style={fieldLabel}>Source</span><span style={fieldValue}>{app.source_board}</span></div>}
        {app.posted_at && <div style={fieldStyle}><span style={fieldLabel}>Posted</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{app.posted_at}</span></div>}
        <div style={fieldStyle}><span style={fieldLabel}>Applied</span><span style={{ ...fieldValue, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
      </div>

      {/* Score match */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={handleScore}
          disabled={scoring || !app.job_description}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: 'var(--bg-2)',
            border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)',
            fontSize: 12, color: scoring ? 'var(--fg-3)' : 'var(--fg-1)', cursor: scoring ? 'default' : 'pointer',
            alignSelf: 'flex-start',
          }}
          title={!app.job_description ? 'Add a job description to enable scoring' : undefined}
        >
          {scoring ? <Loader2 size={13} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} strokeWidth={1.75} />}
          {scoring ? 'Scoring…' : 'Score match'}
        </button>
        {scoreError && <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{scoreError}</p>}
      </div>

      {/* Notes */}
      {app.notes && (
        <div style={fieldStyle}>
          <span style={fieldLabel}>Notes</span>
          <p style={{ ...fieldValue, margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-1)' }}>{app.notes}</p>
        </div>
      )}

      {/* Documents + Contacts — full page only */}
      {fullPage && (
        <>
          {/* Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={sectionLabel}>Documents</div>

            <div style={{ display: 'flex', gap: 8 }}>
              {(['cover_letter', 'tailored_cv'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleGenerate(type)}
                  disabled={generating || !app.job_description}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--r-sm)',
                    fontSize: 12, color: '#fff', cursor: generating ? 'default' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                  }}
                  title={!app.job_description ? 'Add a job description to generate documents' : undefined}
                >
                  {generating
                    ? <Loader2 size={13} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} />
                    : <FileText size={13} strokeWidth={1.75} />}
                  {type === 'cover_letter' ? 'Generate cover letter' : 'Generate tailored CV'}
                </button>
              ))}
            </div>
            {genError && <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{genError}</p>}

            {documents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--bg-2)',
                    border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={14} strokeWidth={1.75} color="var(--fg-2)" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-0)', textTransform: 'capitalize' }}>
                          {doc.type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={`/api/documents/${doc.id}/download?format=pdf`}
                        style={{ padding: '5px 10px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--fg-1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={12} strokeWidth={1.75} /> PDF
                      </a>
                      <a
                        href={`/api/documents/${doc.id}/download?format=docx`}
                        style={{ padding: '5px 10px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--fg-1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={12} strokeWidth={1.75} /> DOCX
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        style={{ padding: '5px 8px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--danger)', fontSize: 12, display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={12} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={sectionLabel}>Contacts</div>
              <button
                onClick={() => setAddingContact(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 12, color: 'var(--fg-2)' }}
              >
                {addingContact ? <X size={12} strokeWidth={1.75} /> : <Plus size={12} strokeWidth={1.75} />}
                {addingContact ? 'Cancel' : 'Add contact'}
              </button>
            </div>

            {addingContact && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'name', placeholder: 'Name *' },
                    { key: 'role', placeholder: 'Title / role' },
                    { key: 'email', placeholder: 'Email' },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type={key === 'email' ? 'email' : 'text'}
                      placeholder={placeholder}
                      value={newContact[key as keyof typeof newContact]}
                      onChange={e => setNewContact(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ padding: '7px 10px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--fg-0)', outline: 'none', gridColumn: key === 'email' ? 'span 2' : undefined }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact || !newContact.name.trim()}
                  style={{ alignSelf: 'flex-start', padding: '6px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, color: '#fff', cursor: savingContact ? 'default' : 'pointer', opacity: savingContact ? 0.6 : 1 }}
                >
                  {savingContact ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}

            {contacts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contacts.map(contact => (
                  <div key={contact.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--bg-2)',
                    border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-0)' }}>{contact.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                        {[contact.role, contact.email].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleDraftOutreach(contact)}
                        disabled={outreachPending === contact.id || !app.job_description}
                        title={!app.job_description ? 'Add a job description first' : 'Draft outreach email'}
                        style={{ padding: '5px 10px', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 12, color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 4, opacity: outreachPending === contact.id ? 0.6 : 1 }}
                      >
                        {outreachPending === contact.id
                          ? <Loader2 size={12} strokeWidth={1.75} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Mail size={12} strokeWidth={1.75} />}
                        {outreachPending === contact.id ? 'Drafting…' : 'Draft outreach'}
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        style={{ padding: '5px 8px', background: 'transparent', border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={12} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {contacts.length === 0 && !addingContact && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)' }}>No contacts yet. Add a hiring contact to draft outreach.</p>
            )}
          </div>
        </>
      )}

      {/* Open full page link — slide-over only */}
      {!fullPage && (
        <Link
          href={`/app/applications/${app.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'var(--bg-2)',
            border: '1px solid var(--border-0)', borderRadius: 'var(--r-sm)',
            fontSize: 13, color: 'var(--fg-1)', textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          Open full page →
        </Link>
      )}
    </div>
  )
}
