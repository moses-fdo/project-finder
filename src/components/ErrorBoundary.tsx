"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { Wrench, RefreshCw, LogOut } from "lucide-react";

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

  handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full card p-8 text-center border-amber-500/30 bg-card shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

            <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner">
              <Wrench size={30} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                System Maintenance &bull; Temporary Hiccup
              </span>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Work in Progress or Temporary Hiccup
              </h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We are currently performing system updates or encountered a brief hiccup. You can try again, refresh the page, or sign out to return to the landing page.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-[12px] font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleSignOut}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-[12px] font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
