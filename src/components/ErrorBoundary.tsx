"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-8 text-center max-w-lg mx-auto my-12 border-destructive/30 bg-destructive/5 space-y-4">
          <h3 className="text-lg font-bold text-destructive">
            Something went wrong
          </h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            An unexpected error occurred while rendering this view.
          </p>
          {this.state.error?.message && (
            <div className="p-3 text-[11px] font-mono text-destructive bg-card border border-destructive/20 rounded-md text-left overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="btn-secondary text-[12px] py-1.5 px-4 cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-[12px] py-1.5 px-4 cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
