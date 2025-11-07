import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    // Fix: Access `children` from `this.props`. If TypeScript incorrectly reports `props` as
    // not existing on `ErrorBoundary`, cast `this` to `any` as a workaround.
    const { children } = (this as any).props;

    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', margin: '20px auto', maxWidth: '600px', color: '#991b1b' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ fontSize: '16px', marginBottom: '15px' }}>We're sorry for the inconvenience. Please try refreshing the page.</p>
          {this.state.error && (
            <details style={{ textAlign: 'left', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ef4444', padding: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
              <summary>Error Details</summary>
              {this.state.error.toString()}
              {/* For full stack trace: {this.state.error.stack} */}
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;