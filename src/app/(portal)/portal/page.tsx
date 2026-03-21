export default function PortalPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}
    >
      <div className="text-center">
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Client Portal
        </h1>
        <p>Coming soon. The client portal will allow your clients to manage their own integrations and view reports.</p>
      </div>
    </div>
  );
}
