"use client";

import { Component, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";

import { problemDetailClasses } from "../problemDetailStyles";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className={problemDetailClasses.codeEditorLoading}>
      코드 편집기를 불러오는 중입니다.
    </div>
  ),
  ssr: false,
});

interface ProblemCodeEditorProps {
  ariaLabel?: string;
  code: string;
  onCodeChange: (nextCode: string) => void;
}

type EditorTheme = "dark" | "light";

interface MonacoErrorBoundaryProps {
  children: ReactNode;
}

interface MonacoErrorBoundaryState {
  hasError: boolean;
}

class MonacoErrorBoundary extends Component<
  MonacoErrorBoundaryProps,
  MonacoErrorBoundaryState
> {
  state: MonacoErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MonacoErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Monaco editor load failed:", error, errorInfo);
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

export default function ProblemCodeEditor({
  ariaLabel = "답안 코드 입력",
  code,
  onCodeChange,
}: ProblemCodeEditorProps) {
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("dark");
  const isDarkTheme = editorTheme === "dark";

  return (
    <div
      className={`${problemDetailClasses.codeEditor} ${
        isDarkTheme
          ? problemDetailClasses.codeEditorDark
          : problemDetailClasses.codeEditorLight
      }`}
    >
      <button
        aria-label={
          isDarkTheme
            ? "코드 편집기를 라이트 모드로 전환"
            : "코드 편집기를 다크 모드로 전환"
        }
        aria-pressed={isDarkTheme}
        className={problemDetailClasses.codeEditorThemeToggle}
        onClick={() => setEditorTheme(isDarkTheme ? "light" : "dark")}
        type="button"
      >
        {isDarkTheme ? "라이트" : "다크"}
      </button>
      <MonacoErrorBoundary>
        <MonacoEditor
          defaultLanguage="python"
          height="100%"
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            ariaLabel,
            automaticLayout: true,
            fontFamily:
              "var(--font-geist-mono), Consolas, 'Liberation Mono', monospace",
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            padding: { top: 44, bottom: 12 },
            parameterHints: { enabled: false },
            quickSuggestions: false,
            renderLineHighlight: "all",
            scrollBeyondLastLine: false,
            snippetSuggestions: "none",
            suggestOnTriggerCharacters: false,
            wordBasedSuggestions: "off",
            detectIndentation: false,
            insertSpaces: true,
            tabFocusMode: false,
            tabSize: 4,
            useTabStops: true,
            wordWrap: "on",
          }}
          theme={isDarkTheme ? "vs-dark" : "light"}
          value={code}
        />
      </MonacoErrorBoundary>
    </div>
  );
}
