'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { pageVariants } from '@/lib/animations';
import { getCompanyById, updateCompany } from '@/lib/actions/companies';
import type { Company } from '@/types';

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCompanyById(companyId).then((c) => {
      if (c) {
        setCompany(c);
        setName(c.name);
        setWebsiteUrl(c.website_url ?? '');
        setDescription(c.description ?? '');
        setContactEmail(c.contact_email ?? '');
        setContactPhone(c.contact_phone ?? '');
      }
    });
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateCompany(companyId, {
      name,
      website_url: websiteUrl || undefined,
      description: description || undefined,
      contact_email: contactEmail || undefined,
      contact_phone: contactPhone || undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-7 h-7"
          style={{
            background: 'var(--fill-quaternary)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <h1 className="font-semibold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {company.name}
        </span>
      </div>

      {/* Form */}
      <div
        className="overflow-hidden"
        style={{ borderRadius: '12px', background: 'var(--bg-elevated)' }}
      >
        {/* Company Name */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--separator)' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Company Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cred-input mt-1"
          />
        </div>

        {/* Website */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--separator)' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Website URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="cred-input mt-1"
          />
        </div>

        {/* Description */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--separator)' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this company do?"
            className="cred-input mt-1"
          />
        </div>

        {/* Contact Email */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--separator)' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Contact Email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="hello@company.com"
            className="cred-input mt-1"
          />
        </div>

        {/* Contact Phone */}
        <div style={{ padding: '10px 14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Contact Phone
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="(305) 555-1234"
            className="cred-input mt-1"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5"
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={13} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ fontSize: '11px', color: 'var(--system-green)', fontWeight: 500 }}
          >
            Saved
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
