import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — catches React rendering errors and shows a fallback UI
 * instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erreur capturée:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-stone-500 mb-6">
              L'application a rencontré un problème inattendu. Vous pouvez essayer de recharger la page.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
              }}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Recharger l'application
            </button>
            <details className="mt-6 text-left">
              <summary className="text-xs text-stone-400 cursor-pointer">Détails de l'erreur</summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
