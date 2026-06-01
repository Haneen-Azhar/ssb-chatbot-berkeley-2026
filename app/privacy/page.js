export const metadata = {
  title: 'Privacy Policy - Summer SSB Staff Assistant',
};

export default function PrivacyPage() {
  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '40px 24px 80px',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      color: '#1a1a1a',
      lineHeight: '1.7',
    }}>
      <a href="/" style={{
        display: 'inline-block',
        marginBottom: '24px',
        color: '#003262',
        fontSize: '14px',
        textDecoration: 'none',
      }}>← Back to Chat</a>

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003262', marginBottom: '8px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
        Last updated: June 1, 2026
      </p>

      <Section title="What this app is">
        <p>
          Summer is an AI staff assistant for Summer Springboard (&quot;SSB&quot;), a summer enrichment
          program operating on university campuses. This app is used by SSB staff (Campus Directors,
          Academic Managers, Summer Program Assistants, Mentors, and Instructors) to get answers about
          program policies, procedures, schedules, and operational questions.
        </p>
      </Section>

      <Section title="What data we collect">
        <Item title="Account information">
          Your email address, name, and role when you sign up. If you sign in with Google, we receive
          your email from Google. We do not access your Google password, contacts, or any other Google data.
        </Item>
        <Item title="Chat messages">
          Every question you ask and every response the assistant provides is stored. This includes
          the message text, timestamps, which knowledge base sources were used, and response
          performance metrics (response time, token count).
        </Item>
        <Item title="Session data">
          We track conversation sessions so you can return to past conversations. Sessions are
          grouped by a unique identifier generated in your browser.
        </Item>
        <Item title="Campus information">
          Files and text uploaded to Campus Info (schedules, rooming lists, mentor lists) are stored
          and made available to all authenticated staff at the same campus.
        </Item>
      </Section>

      <Section title="How we use your data">
        <ul style={{ paddingLeft: '20px' }}>
          <li>To provide AI-assisted answers to your questions</li>
          <li>To personalize responses based on your role (e.g., a CD gets different guidance than a Mentor)</li>
          <li>To show you your conversation history</li>
          <li>To generate aggregate analytics for program administrators (which topics staff ask about most, training gaps)</li>
          <li>To improve the knowledge base and response quality over time</li>
        </ul>
      </Section>

      <Section title="Who can see your data">
        <Item title="You">
          You can see your own conversations, profile, and settings.
        </Item>
        <Item title="Administrators">
          Users with admin access can see all staff queries, response analytics, and usage patterns.
          This is used to identify training needs and improve program operations. Admins can see
          which staff member asked which question.
        </Item>
        <Item title="AI provider">
          Your messages are sent to Anthropic (the company behind Claude) to generate responses.
          Anthropic&apos;s data retention policy applies. Anthropic does not use API inputs/outputs
          to train their models. See{' '}
          <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">
            Anthropic&apos;s privacy policy
          </a>.
        </Item>
        <Item title="No one else">
          We do not sell, share, or provide your data to any other third parties. We do not use your
          data for advertising.
        </Item>
      </Section>

      <Section title="Where data is stored">
        <p>
          Account data and chat history are stored in Supabase (PostgreSQL database) hosted in the
          United States (East US region). The application is hosted on Vercel. All data is transmitted
          over HTTPS (TLS encryption in transit). Supabase provides encryption at rest for the database.
        </p>
      </Section>

      <Section title="How long we keep data">
        <p>
          Chat history is retained for the duration of the program season. Administrators can archive
          sessions at the end of each camp session. Archived data is retained for analysis purposes
          and can be deleted upon request. Account profiles are retained as long as the account is active.
        </p>
      </Section>

      <Section title="Student data (FERPA)">
        <p>
          Staff may mention student names, situations, or incidents in their chat messages. This data
          is treated as confidential educational records under FERPA (Family Educational Rights and
          Privacy Act). Access is restricted to authenticated SSB staff and administrators. We do not
          share student information with any party outside of SSB operations.
        </p>
        <p>
          If you are a parent or guardian and believe your child&apos;s information has been
          improperly handled, contact us at the email below.
        </p>
      </Section>

      <Section title="Your rights">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Access:</strong> You can view all your conversations in the app sidebar</li>
          <li><strong>Deletion:</strong> You can delete individual conversations from the sidebar. To delete your entire account and all associated data, contact us at the email below</li>
          <li><strong>Correction:</strong> You can update your name, role, and bot name in Settings at any time</li>
          <li><strong>Export:</strong> Contact us to request an export of your data</li>
        </ul>
      </Section>

      <Section title="Security">
        <ul style={{ paddingLeft: '20px' }}>
          <li>Authentication via Supabase (Google OAuth or magic link)</li>
          <li>JWT token validation on every API request</li>
          <li>Row Level Security on database tables</li>
          <li>Rate limiting to prevent abuse (15 requests per minute)</li>
          <li>Input validation on all user inputs</li>
          <li>CORS restricted to authorized domains</li>
          <li>Automated security scanning in CI/CD pipeline</li>
          <li>No passwords stored (authentication delegated to Google/Supabase)</li>
        </ul>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy as the application evolves. Material changes will be communicated
          to administrators, who are responsible for informing their staff. The &quot;last updated&quot;
          date at the top of this page reflects the most recent revision.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions, data deletion requests, or concerns, contact:<br />
          <strong>Summer Springboard</strong><br />
          Email: <a href="mailto:alerts@summerspringboard.com">alerts@summerspringboard.com</a><br />
          SSB 24/7 Helpline: +1.858.779.0555
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '28px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#003262', marginBottom: '8px' }}>
        {title}
      </h2>
      <div style={{ fontSize: '15px', color: '#374151' }}>
        {children}
      </div>
    </section>
  );
}

function Item({ title, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <strong style={{ color: '#1a1a1a' }}>{title}:</strong>{' '}
      {children}
    </div>
  );
}
