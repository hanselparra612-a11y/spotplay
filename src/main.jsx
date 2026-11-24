import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SpotPlay App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          backgroundColor: '#0c0f14',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#ffb800' }}>
            Spot Play
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '320px', marginBottom: '20px' }}>
            Hubo un detalle al cargar los datos locales. Toca el botón abajo para refrescar la aplicación limpia.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              backgroundColor: '#ffb800',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '12px 24px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 184, 0, 0.4)'
            }}
          >
            🔄 Recargar Spot Play
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Registrar Service Worker de forma segura
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
