import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('🔴 ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#0a0a0a',
          color: '#fff', gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <span style={{ fontSize: '3rem' }}>🍌</span>
          <h2 style={{ color: '#FBDD33' }}>Algo salió mal</h2>
          <p style={{ color: '#888', maxWidth: '400px' }}>
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
            style={{
              background: '#FBDD33', color: '#000', border: 'none',
              borderRadius: '8px', padding: '0.75rem 1.5rem',
              fontWeight: 700, cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
