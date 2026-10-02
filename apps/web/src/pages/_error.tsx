import React from 'react';

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1020', color: '#F8FAFC', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{statusCode ? `Error ${statusCode}` : 'An error occurred'}</h1>
        <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>Please refresh or return to the home page.</p>
        <a href="/" style={{ color: '#8B5CF6', marginTop: '1rem', display: 'inline-block' }}>Go Home →</a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
