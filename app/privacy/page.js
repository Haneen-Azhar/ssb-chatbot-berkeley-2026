import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Summer SSB Staff Assistant',
  description: 'Privacy Policy for the Summer SSB Staff Assistant powered by AI.',
};

const sections = [
  { id: 'introduction', number: '1', title: 'Introduction' },
  { id: 'information-we-collect', number: '2', title: 'Information We Collect' },
  { id: 'how-we-use-your-information', number: '3', title: 'How We Use Your Information' },
  { id: 'ai-and-automated-processing', number: '4', title: 'AI and Automated Processing' },
  { id: 'data-sharing', number: '5', title: 'Data Sharing' },
  { id: 'data-storage-and-security', number: '6', title: 'Data Storage and Security' },
  { id: 'data-retention', number: '7', title: 'Data Retention' },
  { id: 'childrens-privacy-and-student-data', number: '8', title: 'Children\'s Privacy and Student Data (FERPA)' },
  { id: 'your-rights-and-choices', number: '9', title: 'Your Rights and Choices' },
  { id: 'cookies-and-local-storage', number: '10', title: 'Cookies and Local Storage' },
  { id: 'changes-to-this-policy', number: '11', title: 'Changes to This Policy' },
  { id: 'contact-information', number: '12', title: 'Contact Information' },
];

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Top navigation */}
      <nav style={{
        borderBottom: '1px solid #e5e5e5',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Link
            href="/"
            style={{
              color: '#003262',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            &larr; Back to Summer Assistant
          </Link>
        </div>
      </nav>

      <main style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 24px 96px',
      }}>
        {/* Page title */}
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b6b6b',
            margin: 0,
          }}>
            Effective June 1, 2026
          </p>
        </header>

        {/* Table of contents */}
        <nav style={{
          marginBottom: '48px',
          paddingBottom: '32px',
          borderBottom: '1px solid #e5e5e5',
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#6b6b6b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 16px',
          }}>
            Table of Contents
          </p>
          <ol style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            {sections.map((section) => (
              <li key={section.id} style={{ marginBottom: '8px' }}>
                <a
                  href={`#${section.id}`}
                  style={{
                    color: '#003262',
                    textDecoration: 'none',
                    fontSize: '15px',
                    lineHeight: '1.5',
                  }}
                >
                  {section.number}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <article style={{
          fontSize: '15px',
          lineHeight: '1.75',
          color: '#333333',
        }}>
          {/* 1. Introduction */}
          <section id="introduction" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>1. Introduction</h2>
            <p style={paragraphStyle}>
              This Privacy Policy describes how Summer Springboard (&quot;SSB,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects,
              uses, and protects information when you use the Summer Staff Assistant (&quot;Summer&quot; or the &quot;Service&quot;),
              an AI-powered tool designed to help SSB staff members access program policies, procedures, schedules,
              and operational information.
            </p>
            <p style={paragraphStyle}>
              This policy applies to all users of the Service, including Campus Directors, Academic Managers,
              Program Assistants, Mentors, Instructors, and other authorized SSB staff. By using Summer,
              you agree to the collection and use of information as described in this policy.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 2. Information We Collect */}
          <section id="information-we-collect" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>2. Information We Collect</h2>

            <h3 style={subheadingStyle}>Account Information</h3>
            <p style={paragraphStyle}>
              When you create an account, we collect your name, email address, and role within SSB. If you
              sign in with Google, we receive only the email address and display name associated with your
              Google account. We do not receive or store your Google password.
            </p>

            <h3 style={subheadingStyle}>Chat Content</h3>
            <p style={paragraphStyle}>
              We collect the messages you send to Summer and the AI-generated responses you receive. Each
              message is stored with a timestamp and associated with your account. Conversations are organized
              into sessions that you can view in your chat history.
            </p>

            <h3 style={subheadingStyle}>Uploaded Files</h3>
            <p style={paragraphStyle}>
              Staff may upload documents such as schedules, rooming lists, and operational reference materials
              through the Campus Info feature. These files are stored and made accessible to all authenticated
              staff at the relevant campus.
            </p>

            <h3 style={subheadingStyle}>Usage Data</h3>
            <p style={paragraphStyle}>
              We automatically collect information about how you interact with the Service, including session
              identifiers, response times, the knowledge base sources referenced in generating answers, and
              performance metrics. This data helps us monitor and improve the quality of responses.
            </p>

            <h3 style={subheadingStyle}>Device and Browser Information</h3>
            <p style={paragraphStyle}>
              We collect standard technical information transmitted by your browser, including your device
              type, browser type, and general connection information. We do not collect precise location data.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 3. How We Use Your Information */}
          <section id="how-we-use-your-information" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>3. How We Use Your Information</h2>
            <p style={paragraphStyle}>We use the information we collect to:</p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Provide AI-assisted answers to your questions about SSB policies, procedures, and operations</li>
              <li style={listItemStyle}>Personalize responses based on your staff role and campus assignment</li>
              <li style={listItemStyle}>Maintain your conversation history so you can access it across devices and sessions</li>
              <li style={listItemStyle}>Generate aggregate analytics for program administrators to identify common questions, training needs, and knowledge gaps</li>
              <li style={listItemStyle}>Improve the accuracy and quality of the knowledge base and AI responses over time</li>
              <li style={listItemStyle}>Ensure the security and proper functioning of the Service</li>
            </ul>
          </section>

          <hr style={dividerStyle} />

          {/* 4. AI and Automated Processing */}
          <section id="ai-and-automated-processing" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>4. AI and Automated Processing</h2>
            <p style={paragraphStyle}>
              Summer uses Anthropic&apos;s Claude API to generate responses to your questions. When you send a
              message, it is transmitted to Anthropic&apos;s servers along with relevant context from the SSB
              knowledge base. Anthropic processes this data to generate a response, which is then returned
              to you through the Service.
            </p>
            <p style={paragraphStyle}>
              Under Anthropic&apos;s API data usage policy, messages sent through the API are not used to train
              Anthropic&apos;s models. Anthropic may retain API inputs and outputs for up to 30 days for trust
              and safety purposes, after which they are deleted. For more details, refer to{' '}
              <a href="https://www.anthropic.com/privacy" style={linkStyle}>Anthropic&apos;s Privacy Policy</a>.
            </p>
            <p style={paragraphStyle}>
              AI-generated responses may not always be accurate. Summer is designed to assist staff, not replace
              official SSB guidance. Staff should verify critical information with their supervisors or official
              documentation.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 5. Data Sharing */}
          <section id="data-sharing" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>5. Data Sharing</h2>
            <p style={paragraphStyle}>We share your information only in the following limited circumstances:</p>

            <h3 style={subheadingStyle}>SSB Administrators</h3>
            <p style={paragraphStyle}>
              Program administrators can view all staff queries, conversations, and usage patterns. This access
              is used to identify training needs, monitor program operations, and improve staff support.
            </p>

            <h3 style={subheadingStyle}>Anthropic</h3>
            <p style={paragraphStyle}>
              As described in Section 4, your messages and relevant context are sent to Anthropic to generate
              AI responses. Anthropic acts as a data processor and does not use this data for model training.
            </p>

            <h3 style={subheadingStyle}>No Other Third Parties</h3>
            <p style={paragraphStyle}>
              We do not sell, rent, or share your personal information with any other third parties. We do not
              use your data for advertising. We do not provide data to data brokers or marketing platforms.
            </p>

            <h3 style={subheadingStyle}>Legal Requirements</h3>
            <p style={paragraphStyle}>
              We may disclose your information if required to do so by law, regulation, or legal process, or
              if we believe in good faith that disclosure is necessary to protect the rights, safety, or property
              of SSB, our users, or the public.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 6. Data Storage and Security */}
          <section id="data-storage-and-security" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>6. Data Storage and Security</h2>
            <p style={paragraphStyle}>
              Your data is stored in a Supabase-hosted PostgreSQL database located in the United States.
              We implement the following security measures to protect your information:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>All data is transmitted over HTTPS with TLS encryption</li>
              <li style={listItemStyle}>Authentication is handled through Google OAuth or secure magic link email, with no passwords stored in our systems</li>
              <li style={listItemStyle}>Every API request is validated with JWT token authentication</li>
              <li style={listItemStyle}>Row Level Security (RLS) policies are enforced at the database level to restrict data access</li>
              <li style={listItemStyle}>API rate limiting is applied at 15 requests per minute to prevent abuse</li>
              <li style={listItemStyle}>Cross-Origin Resource Sharing (CORS) is restricted to authorized domains</li>
            </ul>
            <p style={paragraphStyle}>
              While we take reasonable measures to protect your information, no method of electronic transmission
              or storage is completely secure. We cannot guarantee absolute security.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 7. Data Retention */}
          <section id="data-retention" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>7. Data Retention</h2>
            <p style={paragraphStyle}>
              Chat history and usage data are retained for the duration of the program season. At the end of
              each camp session, administrators may archive conversation sessions. Archived data is retained
              for operational review and can be permanently deleted upon request.
            </p>
            <p style={paragraphStyle}>
              User accounts remain active until manually removed by an administrator. Upon account deletion,
              all associated personal data and conversation history are permanently removed from our active
              systems. Backups containing this data may persist for up to 30 days before automatic deletion.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 8. Children's Privacy and Student Data (FERPA) */}
          <section id="childrens-privacy-and-student-data" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>8. Children&apos;s Privacy and Student Data (FERPA)</h2>
            <p style={paragraphStyle}>
              The Service is intended for use by authorized SSB staff members only. It is not directed at
              children or students. However, because SSB operates educational enrichment programs for minors,
              staff members may reference student names, incidents, or other student-related information in
              their conversations with Summer.
            </p>
            <p style={paragraphStyle}>
              Any student information shared through the Service is treated as confidential educational records
              subject to the Family Educational Rights and Privacy Act (FERPA). We implement the following
              protections for student data:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Access to the Service is restricted to authenticated, authorized SSB staff and administrators</li>
              <li style={listItemStyle}>Student information is not shared outside of SSB operations</li>
              <li style={listItemStyle}>Student data is not used for any commercial purpose</li>
              <li style={listItemStyle}>Staff are instructed to avoid including unnecessary student personally identifiable information in their queries</li>
              <li style={listItemStyle}>All FERPA-related data is subject to the same security measures described in Section 6</li>
            </ul>
            <p style={paragraphStyle}>
              If you believe that student data has been improperly handled, please contact us immediately
              using the information in Section 12.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 9. Your Rights and Choices */}
          <section id="your-rights-and-choices" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>9. Your Rights and Choices</h2>
            <p style={paragraphStyle}>You have the following rights regarding your personal information:</p>

            <h3 style={subheadingStyle}>Access</h3>
            <p style={paragraphStyle}>
              You can view all of your conversations and stored data through the chat sidebar in the application.
            </p>

            <h3 style={subheadingStyle}>Deletion</h3>
            <p style={paragraphStyle}>
              You can delete individual conversations from the chat sidebar. To request complete account deletion,
              including all associated data, contact us using the information in Section 12.
            </p>

            <h3 style={subheadingStyle}>Correction</h3>
            <p style={paragraphStyle}>
              You can update your name, role, and display preferences through the Settings page in the application.
            </p>

            <h3 style={subheadingStyle}>Data Export</h3>
            <p style={paragraphStyle}>
              You may request an export of your personal data by contacting us. We will provide your data in a
              commonly used, machine-readable format within a reasonable timeframe.
            </p>

            <h3 style={subheadingStyle}>Opt Out</h3>
            <p style={paragraphStyle}>
              Use of the Service is voluntary. If you do not wish for your data to be processed as described
              in this policy, you may discontinue use of the Service at any time.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 10. Cookies and Local Storage */}
          <section id="cookies-and-local-storage" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>10. Cookies and Local Storage</h2>
            <p style={paragraphStyle}>
              The Service uses browser local storage and session storage to maintain your authentication state,
              user preferences (such as your preferred bot name and theme), and session information. These are
              essential for the functioning of the Service.
            </p>
            <p style={paragraphStyle}>
              We do not use third-party tracking cookies, advertising cookies, or analytics cookies.
              No cross-site tracking is performed.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 11. Changes to This Policy */}
          <section id="changes-to-this-policy" style={{ marginBottom: '40px' }}>
            <h2 style={sectionHeadingStyle}>11. Changes to This Policy</h2>
            <p style={paragraphStyle}>
              We may update this Privacy Policy from time to time to reflect changes in our practices, the
              Service, or applicable laws. When we make material changes, we will update the &quot;Effective&quot; date
              at the top of this page. We encourage you to review this policy periodically.
            </p>
            <p style={paragraphStyle}>
              Continued use of the Service after changes to this policy constitutes acceptance of the
              updated terms.
            </p>
          </section>

          <hr style={dividerStyle} />

          {/* 12. Contact Information */}
          <section id="contact-information" style={{ marginBottom: '0' }}>
            <h2 style={sectionHeadingStyle}>12. Contact Information</h2>
            <p style={paragraphStyle}>
              If you have questions about this Privacy Policy, wish to exercise your data rights, or have
              concerns about how your information is handled, please contact us:
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e5e5e5',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '13px',
          color: '#999999',
          margin: 0,
        }}>
          &copy; {new Date().getFullYear()} Summer Springboard. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

const sectionHeadingStyle = {
  fontSize: '22px',
  fontWeight: 600,
  color: '#1a1a1a',
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const subheadingStyle = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1a1a1a',
  margin: '24px 0 8px',
  lineHeight: '1.4',
};

const paragraphStyle = {
  margin: '0 0 16px',
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '40px 0',
};

const linkStyle = {
  color: '#003262',
  textDecoration: 'underline',
  textDecorationColor: '#c0c0c0',
  textUnderlineOffset: '2px',
};

const listStyle = {
  paddingLeft: '24px',
  margin: '0 0 16px',
};

const listItemStyle = {
  marginBottom: '8px',
};
