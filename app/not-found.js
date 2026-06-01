import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: 'var(--font-open-sans), "Open Sans", sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <img
        src="/images/cal-bear-avatar.webp"
        alt="Cal Bear"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          marginBottom: '24px',
        }}
      />
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#003262',
          margin: '0 0 12px 0',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: '#555555',
          margin: '0 0 32px 0',
          maxWidth: '420px',
          lineHeight: '1.5',
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: '#003262',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '8px',
          padding: '12px 32px',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          display: 'inline-block',
        }}
      >
        Back to Chat
      </Link>
    </div>
  );
}
