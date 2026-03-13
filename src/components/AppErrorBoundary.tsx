import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-xl w-full rounded-lg border bg-card p-6 space-y-3 text-center">
            <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground">تم منع تعطل الصفحة بالكامل. يرجى تحديث الصفحة أو المحاولة لاحقًا.</p>
            <p className="text-xs text-muted-foreground break-all">{this.state.message}</p>
            <button className="h-10 px-4 rounded-lg border" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
