import React from 'react';
import { toast } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } }
      });
    }
  }

  handleReset = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: null,
        retryCount: this.state.retryCount + 1 
      });
      toast.success(`Retrying... (Attempt ${this.state.retryCount + 1}/${this.state.maxRetries})`);
    } else {
      toast.error('Maximum retries reached. Please refresh the page.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 max-w-lg mx-auto text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-purple-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                disabled={this.state.retryCount >= this.state.maxRetries}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {this.state.retryCount >= this.state.maxRetries ? 'Max Retries Reached' : 'Try Again'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 text-white font-semibold transition-all"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-purple-400 cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-3 bg-gray-800 rounded text-xs text-red-300 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
