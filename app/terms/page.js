import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Summer SSB Staff Assistant',
  description: 'Terms of Service for the Summer SSB Staff Assistant.',
};

const sections = [
  { id: 'acceptance', number: '1', title: 'Acceptance of Terms' },
  { id: 'service-description', number: '2', title: 'Description of Service' },
  { id: 'eligibility', number: '3', title: 'Eligibility and Access' },
  { id: 'acceptable-use', number: '4', title: 'Acceptable Use' },
  { id: 'ai-limitations', number: '5', title: 'AI Limitations and Disclaimers' },
  { id: 'user-content', number: '6', title: 'User Content' },
  { id: 'confidentiality', number: '7', title: 'Confidentiality and Student Data' },
  { id: 'intellectual-property', number: '8', title: 'Intellectual Property' },
  { id: 'availability', number: '9', title: 'Service Availability' },
  { id: 'limitation-of-liability', number: '10', title: 'Limitation of Liability' },
  { id: 'termination', number: '11', title: 'Termination' },
  { id: 'changes', number: '12', title: 'Changes to Terms' },
  { id: 'governing-law', number: '13', title: 'Governing Law' },
  { id: 'contact', number: '14', title: 'Contact' },
];

const sectionHeadingStyle = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1a1a1a',
  margin: '0 0 12px',
  letterSpacing: '-0.2px',
};

const subheadingStyle = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#1a1a1a',
  margin: '20px 0 8px',
};

const paragraphStyle = {
  margin: '0 0 16px',
};

const linkStyle = {
  color: '#003262',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '32px 0',
};

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <nav style={{ borderBottom: '1px solid #e5e5e5', padding: '16px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Link href="/" style={{ color: '#003262', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            &larr; Back to Summer Assistant
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '36px', fontWeight: 700, color: '#1a1a1a',
            margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: '1.2',
          }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '14px', color: '#6b6b6b', margin: 0 }}>
            Effective June 1, 2026
          </p>
        </header>

        <nav style={{ marginBottom: '48px', paddingBottom: '32px', borderBottom: '1px solid #e5e5e5' }}>
          <p style={{
            fontSize: '13px', fontWeight: 600, color: '#6b6b6b',
            textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px',
          }}>
            Table of Contents
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sections.map((s) => (
              <li key={s.id} style={{ marginBottom: '8px' }}>
                <a href={`#${s.id}`} style={{ color: '#003262', textDecoration: 'none', fontSize: '15px', lineHeight: '1.5' }}>
                  {s.number}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article style={{ fontSize: '15px', lineHeight: '1.75', color: '#333333' }}>

          <section id="acceptance" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>1. Acceptance of Terms</h2>
            <p style={paragraphStyle}>
              By accessing or using the Summer Staff Assistant (&quot;Summer&quot; or the &quot;Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms
              constitute a binding agreement between you and Summer Springboard (&quot;SSB,&quot; &quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;).
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="service-description" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>2. Description of Service</h2>
            <p style={paragraphStyle}>
              Summer is an AI-powered assistant that helps SSB staff access program policies, emergency procedures,
              schedules, and operational information. The Service uses artificial intelligence (Anthropic Claude)
              to generate responses based on a curated knowledge base and uploaded campus-specific information.
            </p>
            <p style={paragraphStyle}>
              The Service includes a chat interface, admin analytics dashboard, campus information management tools,
              and conversation history. It is intended solely as a supplementary reference tool for SSB staff, not
              as a replacement for professional judgment, official policies, or emergency services.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="eligibility" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>3. Eligibility and Access</h2>
            <p style={paragraphStyle}>
              The Service is available only to authorized SSB staff members. Access is restricted to users with
              a valid <code style={{ background: '#f3f4f6', padding: '2px 5px', borderRadius: '3px', fontSize: '13px' }}>@summerspringboard.com</code> email
              address or who have received a direct invitation from an administrator. Unauthorized access or
              sharing of login credentials is prohibited.
            </p>
            <p style={paragraphStyle}>
              You are responsible for maintaining the security of your account and for all activity that occurs
              under your account. Notify us immediately if you believe your account has been compromised.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="acceptable-use" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>4. Acceptable Use</h2>
            <p style={paragraphStyle}>You agree to use the Service only for legitimate SSB operational purposes. You may not:</p>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Use the Service for any purpose unrelated to SSB operations</li>
              <li style={{ marginBottom: '6px' }}>Attempt to circumvent access controls, rate limits, or security measures</li>
              <li style={{ marginBottom: '6px' }}>Submit false, misleading, or harmful content</li>
              <li style={{ marginBottom: '6px' }}>Share confidential student or staff information outside of authorized SSB channels</li>
              <li style={{ marginBottom: '6px' }}>Attempt to extract, reverse-engineer, or replicate the underlying AI model or knowledge base</li>
              <li style={{ marginBottom: '6px' }}>Use the Service to make decisions that require professional medical, legal, or safety judgment without consulting appropriate professionals</li>
              <li style={{ marginBottom: '6px' }}>Overload the Service with automated requests or scripts</li>
            </ul>
          </section>

          <hr style={dividerStyle} />

          <section id="ai-limitations" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>5. AI Limitations and Disclaimers</h2>
            <p style={paragraphStyle}>
              Summer uses artificial intelligence to generate responses. While we strive for accuracy, AI-generated
              content may occasionally be incorrect, incomplete, or outdated. The Service is provided &quot;as is&quot;
              and &quot;as available.&quot;
            </p>

            <h3 style={subheadingStyle}>Not a substitute for professional judgment</h3>
            <p style={paragraphStyle}>
              Responses from Summer are informational and should not replace your professional judgment, official
              SSB policies, or direct communication with supervisors. In emergency situations, always call 9-1-1
              first and follow established emergency procedures.
            </p>

            <h3 style={subheadingStyle}>No medical or legal advice</h3>
            <p style={paragraphStyle}>
              Summer does not provide medical diagnoses, legal counsel, or professional advice. For medical
              emergencies, contact emergency services. For legal questions, consult SSB leadership or legal counsel.
            </p>

            <h3 style={subheadingStyle}>Knowledge base accuracy</h3>
            <p style={paragraphStyle}>
              Responses are based on a curated knowledge base that is updated periodically. Information may not
              reflect the most recent policy changes. When in doubt, verify with your Campus Director or the
              official SSB staff manual.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="user-content" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>6. User Content</h2>
            <p style={paragraphStyle}>
              You retain ownership of the content you submit to the Service, including chat messages and uploaded
              files. By using the Service, you grant SSB a non-exclusive, worldwide license to store, process,
              and display your content as necessary to operate and improve the Service.
            </p>
            <p style={paragraphStyle}>
              You are responsible for ensuring that any content you submit does not violate applicable laws,
              third-party rights, or SSB policies. SSB reserves the right to remove content that violates
              these terms.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="confidentiality" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>7. Confidentiality and Student Data</h2>
            <p style={paragraphStyle}>
              Chat conversations may contain confidential information about students, staff, and program
              operations. All users must handle this information in accordance with SSB&apos;s confidentiality
              policies and applicable law, including the Family Educational Rights and Privacy Act (FERPA).
            </p>
            <p style={paragraphStyle}>
              You must not share, screenshot, or distribute chat conversations containing student information
              outside of authorized SSB channels. Violations may result in immediate termination of access
              and disciplinary action.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="intellectual-property" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>8. Intellectual Property</h2>
            <p style={paragraphStyle}>
              The Service, including its design, code, knowledge base, and AI-generated content, is the property
              of SSB and its licensors. You may not copy, modify, distribute, or create derivative works from
              any part of the Service without prior written permission.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="availability" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>9. Service Availability</h2>
            <p style={paragraphStyle}>
              We aim to maintain the Service&apos;s availability but do not guarantee uninterrupted access. The
              Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our
              control. We will make reasonable efforts to notify users of planned downtime.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="limitation-of-liability" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>10. Limitation of Liability</h2>
            <p style={paragraphStyle}>
              To the maximum extent permitted by law, SSB and its affiliates, officers, employees, and agents
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the Service, including but not limited to damages for loss of data,
              revenue, or other intangible losses.
            </p>
            <p style={paragraphStyle}>
              SSB&apos;s total liability for any claim arising from or related to the Service shall not exceed
              the amount paid by you to access the Service in the twelve months preceding the claim.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="termination" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>11. Termination</h2>
            <p style={paragraphStyle}>
              SSB may suspend or terminate your access to the Service at any time, with or without cause, and
              with or without notice. Upon termination, your right to use the Service ceases immediately. SSB
              may retain your data in accordance with our{' '}
              <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>.
            </p>
            <p style={paragraphStyle}>
              You may request account deletion at any time by contacting us at the email below.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="changes" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>12. Changes to Terms</h2>
            <p style={paragraphStyle}>
              We may update these Terms of Service from time to time. Material changes will be communicated
              to administrators, who are responsible for informing their staff. Continued use of the Service
              after changes are posted constitutes acceptance of the revised terms.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="governing-law" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>13. Governing Law</h2>
            <p style={paragraphStyle}>
              These Terms are governed by and construed in accordance with the laws of the State of California,
              without regard to its conflict of law provisions. Any disputes arising from these Terms or the
              Service shall be resolved in the courts of San Francisco County, California.
            </p>
          </section>

          <hr style={dividerStyle} />

          <section id="contact" style={{ marginBottom: '0' }}>
            <h2 style={sectionHeadingStyle}>14. Contact</h2>
            <p style={paragraphStyle}>
              For questions about these Terms of Service, contact:
            </p>
            <p style={{ ...paragraphStyle, marginBottom: 0 }}>
              <strong>Haneen Azhar</strong><br />
              Email:{' '}
              <a href="mailto:haneen@uni.minerva.edu" style={linkStyle}>
                haneen@uni.minerva.edu
              </a><br />
              Phone: (415) 888-0650
            </p>
          </section>
        </article>
      </main>

      <footer style={{
        borderTop: '1px solid #e5e5e5', padding: '24px',
        textAlign: 'center', fontSize: '13px', color: '#9a9a9a',
      }}>
        &copy; {new Date().getFullYear()} Summer Springboard. All rights reserved.
      </footer>
    </div>
  );
}
