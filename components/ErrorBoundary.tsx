


import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Declare 'state' as a class property with its explicit type.
  // This is a more modern and robust way to initialize state in React class components
  // and resolves the type inference issues for 'this.state', 'this.props', and 'this.setState'.
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  // FIX: Removed 'public' modifier as it's not standard for static methods in React.
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null };
  }

  // FIX: Removed 'public' modifier as it's not standard for React lifecycle methods.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // FIX: 'this.setState' is now correctly recognized due to explicit 'state' declaration.
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  // FIX: Removed 'public' modifier as it's not standard for React lifecycle methods.
  render() {
    // FIX: 'this.state' is now correctly recognized.
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center', border: '1px solid red', borderRadius: '8px', margin: '20px', backgroundColor: '#ffe6e6' }}>
          <h2 style={{ color: 'red' }}>Oops! Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', margin: '20px auto', maxWidth: '600px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    // FIX: 'this.props' is now correctly recognized due to proper class inheritance and state declaration.
    return this.props.children;
  }
}

export default ErrorBoundary;