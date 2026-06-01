'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
              fontSize: '24px',
              fontWeight: '700',
              color: '#003262',
              margin: '0 0 12px 0',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#555555',
              margin: '0 0 32px 0',
              maxWidth: '400px',
              lineHeight: '1.5',
            }}
          >
            Try refreshing the page. If the problem continues,{' '}
            <a
              href="mailto:haneen@uni.minerva.edu?subject=SSB%20chatbot%20support%20issue"
              style={{ color: '#003262', textDecoration: 'underline' }}
            >
              contact support
            </a>.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#003262',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
