import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-[24px] shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-2 text-primary">MEAT MAN: System Error</h2>
          <p className="text-sm text-text/50 mb-6">Something sizzled where it should have seared. Please reload.</p>
          <button 
            onClick={() => window.location.reload()}
            className="vibrant-button px-8 py-3 bg-primary text-white font-bold shadow-lg shadow-primary/20"
          >
            Reload Website
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
