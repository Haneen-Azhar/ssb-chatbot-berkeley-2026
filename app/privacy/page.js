import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Summer SSB Staff Assistant',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #003262 0%, #00507a 100%)',
        padding: '40px 24px 48px',
        textAlign: 'center',
      }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          textDecoration: 'none',
          marginBottom: '20px',
        }}>
          ← Back to Chat
        </Link>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: 'white',
          margin: '0 0 6px',
          fontFamily: 'Montserrat, -apple-system, sans-serif',
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
          Last updated: June 1, 2026
        </p>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '680px',
        margin: '-24px auto 0',
        padding: '0 20px 80px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          fontSize: '15px',
          color: '#374151',
          lineHeight: '1.75',
        }}>
          <Section title="What this app is">
            <p>
              Summer is an AI staff assistant for Summer Springboard, a summer enrichment
              program on university campuses. It helps staff (Campus Directors, Academic Managers,
              Program Assistants, Mentors, and Instructors) get answers about program policies,
              procedures, schedules, and operational questions.
            </p>
          </Section>

          <Divider />

          <Section title="What we collect">
            <Grid>
              <Card icon="👤" title="Account info">
                Email, name, and role when you sign up. With Google sign-in, we only receive your email.
              </Card>
              <Card icon="💬" title="Chat messages">
                Every question and response, with timestamps and performance metrics.
              </Card>
              <Card icon="📁" title="Uploaded files">
                Schedules, rooming lists, and other files uploaded to Campus Info. Available to all staff at your campus.
              </Card>
              <Card icon="📊" title="Usage data">
                Session identifiers, response times, and which knowledge base sources were used.
              </Card>
            </Grid>
          </Section>

          <Divider />

          <Section title="How we use it">
            <BulletList items={[
              'Provide AI-assisted answers to your questions',
              'Personalize responses based on your role',
              'Show your conversation history across devices',
              'Generate aggregate analytics for administrators',
              'Improve the knowledge base and response quality',
            ]} />
          </Section>

          <Divider />

          <Section title="Who can see your data">
            <Grid>
              <Card icon="🔒" title="You">
                Your own conversations, profile, and settings.
              </Card>
              <Card icon="👥" title="Admins">
                All staff queries and usage patterns. Used to identify training needs.
              </Card>
              <Card icon="🤖" title="Anthropic (AI)">
                Messages are sent to Anthropic to generate responses. They do not use API data to train models.
              </Card>
              <Card icon="🚫" title="No one else">
                We do not sell, share, or provide data to any other third parties.
              </Card>
            </Grid>
          </Section>

          <Divider />

          <Section title="Storage &amp; security">
            <BulletList items={[
              'Data stored in Supabase (PostgreSQL) in the United States',
              'All data transmitted over HTTPS (TLS encryption)',
              'Authentication via Google OAuth or magic link',
              'JWT token validation on every API request',
              'Row Level Security on database tables',
              'Rate limiting (15 requests per minute)',
              'CORS restricted to authorized domains',
              'No passwords stored — authentication delegated to Google/Supabase',
            ]} />
          </Section>

          <Divider />

          <Section title="Data retention">
            <p>
              Chat history is retained for the program season. Administrators can archive sessions
              at the end of each camp session. Archived data can be deleted on request. Accounts
              remain active until manually removed.
            </p>
          </Section>

          <Divider />

          <Section title="Student data (FERPA)">
            <p style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '14px',
              color: '#92400e',
              lineHeight: '1.6',
            }}>
              Staff may mention student names or incidents in chat. This data is treated as
              confidential under FERPA. Access is restricted to authenticated SSB staff and
              administrators. We do not share student information outside SSB operations.
            </p>
          </Section>

          <Divider />

          <Section title="Your rights">
            <Grid>
              <MiniCard title="Access" desc="View all your conversations in the sidebar" />
              <MiniCard title="Delete" desc="Delete conversations from the sidebar, or request full account deletion" />
              <MiniCard title="Correct" desc="Update your name, role, and bot name in Settings" />
              <MiniCard title="Export" desc="Contact us to request an export of your data" />
            </Grid>
          </Section>

          <Divider />

          <Section title="Contact">
            <p>
              For privacy questions, data deletion, or concerns:<br />
              <strong>Summer Springboard</strong><br />
              <a href="mailto:alerts@summerspringboard.com" style={{ color: '#003262' }}>
                alerts@summerspringboard.com
              </a><br />
              SSB 24/7 Helpline: +1.858.779.0555
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <h2 style={{
        fontSize: '17px',
        fontWeight: 700,
        color: '#003262',
        marginBottom: '10px',
        fontFamily: 'Montserrat, -apple-system, sans-serif',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />;
}

function Grid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '12px',
    }}>
      {children}
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '10px',
      padding: '14px 16px',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
        {children}
      </div>
    </div>
  );
}

function MiniCard({ title, desc }) {
  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '10px',
      padding: '12px 16px',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#003262', marginBottom: '2px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>
        {desc}
      </div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ paddingLeft: '20px', margin: '0' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '6px', fontSize: '14px' }}>{item}</li>
      ))}
    </ul>
  );
}
