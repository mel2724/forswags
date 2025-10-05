import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Immediately reload on React dispatcher errors - don't even show error UI
    if (error.message?.includes('dispatcher is null') || 
        error.message?.includes('useContext') ||
        error.message?.includes('useState') ||
        error.message?.includes('useEffect') ||
        error.message?.includes('useReducer')) {
      // Force immediate reload without delay
      setTimeout(() => window.location.reload(), 0);
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-reload on React dispatcher errors during development
    if (error.message?.includes('dispatcher is null') || 
        error.message?.includes('useContext') ||
        error.message?.includes('useState') ||
        error.message?.includes('useEffect') ||
        error.message?.includes('useReducer')) {
      console.log('React HMR error detected - reloading immediately...');
      // Immediate reload
      window.location.reload();
    }
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An error occurred while rendering this page. This sometimes happens during development.
              </p>
              <Button onClick={this.handleReset} className="w-full">
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
