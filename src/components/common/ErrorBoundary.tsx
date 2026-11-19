import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Unknown runtime error occurred';
      const isArabic =
        typeof document !== 'undefined' &&
        (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl');

      return (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="min-h-screen w-full flex items-center justify-center p-6"
          style={{
            backgroundColor: '#f9f0f5',
            color: '#3a1d43',
            fontFamily: isArabic ? "'Cairo', sans-serif" : 'inherit',
          }}
        >
          <div className="w-full max-w-lg rounded-3xl p-8 bg-white/90 backdrop-blur-xl border border-[#e8d7e4] shadow-[0_24px_48px_rgba(58,29,67,0.08)] text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-[#cbb6ea]/25 text-[#73358c]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2 text-[#3a1d43]">
              {isArabic ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-[#3a1d43]/70 mb-6">
              {isArabic
                ? 'نعتذر عن هذا الخطأ. يمكنك إعادة تحميل الصفحة أو مسح الذاكرة المؤقتة للبدء من جديد.'
                : 'An unexpected runtime error occurred. You can reload the page or clear the local cache.'}
            </p>

            <div className="p-3 mb-6 rounded-xl bg-[#f3e6f0]/80 border border-[#e8d7e4] text-xs font-mono text-[#3a1d43]/80 text-left overflow-x-auto max-h-32">
              {errorMessage}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-sm bg-[#cbb6ea] hover:bg-[#bfa5e3] text-[#3a1d43] transition-all shadow-sm"
              >
                {isArabic ? 'إعادة تحميل الصفحة' : 'Reload Page'}
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-sm bg-white hover:bg-[#f3e6f0] border border-[#e8d7e4] text-[#3a1d43] transition-all"
              >
                {isArabic ? 'مسح الذاكرة المؤقتة' : 'Clear Cache & Reset'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
