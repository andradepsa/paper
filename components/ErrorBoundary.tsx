

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
  // FIX: Changed state initialization to use a constructor. This is a more robust pattern that avoids potential issues with class field syntax in some environments and ensures the component's type is correctly inferred.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // FIX: Removed 'public' modifier and renamed '_' to 'error' for clarity.
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null };
  }

  // FIX: Removed 'public' modifier.
  // FIX: Explicitly use the imported ErrorInfo type to ensure TypeScript correctly recognizes this as a React Component method.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // FIX: Using a constructor for state initialization resolves the type inference issue, making `this.setState` available.
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log error messages to an error reporting service here
    // logErrorToMyService(error, errorInfo);
  }

  // FIX: Removed 'public' modifier.
  render() {
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

    // FIX: Using a constructor for state initialization resolves the type inference issue, making `this.props` available.
    return this.props.children;
  }
}

export default ErrorBoundary;
