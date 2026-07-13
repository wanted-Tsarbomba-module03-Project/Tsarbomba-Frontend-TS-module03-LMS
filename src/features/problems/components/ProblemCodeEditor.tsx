"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";

import { problemDetailClasses } from "../problemDetailStyles";
import type { ProblemCodeMirrorCoreProps } from "./ProblemCodeMirrorCore";

const ProblemCodeMirrorCore = dynamic(() => import("./ProblemCodeMirrorCore"), {
  loading: () => (
    <div className={problemDetailClasses.codeEditorLoading}>
      코드 편집기를 불러오는 중입니다.
    </div>
  ),
  ssr: false,
});

interface CodeEditorErrorBoundaryProps {
  children: ReactNode;
}

interface CodeEditorErrorBoundaryState {
  hasError: boolean;
}

class CodeEditorErrorBoundary extends Component<
  CodeEditorErrorBoundaryProps,
  CodeEditorErrorBoundaryState
> {
  state: CodeEditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CodeEditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CodeMirror editor load failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={problemDetailClasses.codeEditorError} role="alert">
          코드 편집기를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시
          시도해 주세요.
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ProblemCodeEditor(props: ProblemCodeMirrorCoreProps) {
  return (
    <CodeEditorErrorBoundary>
      <ProblemCodeMirrorCore {...props} />
    </CodeEditorErrorBoundary>
  );
}
