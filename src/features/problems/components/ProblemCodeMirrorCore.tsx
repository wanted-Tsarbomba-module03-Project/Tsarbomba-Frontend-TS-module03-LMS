"use client";

import { useEffect, useRef, useState } from "react";
import { pythonLanguage } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  defaultHighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  Compartment,
  EditorSelection,
  EditorState,
  type Extension,
} from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  type Command,
  type ViewUpdate,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";

import { problemDetailClasses } from "../problemDetailStyles";

export interface ProblemCodeMirrorCoreProps {
  ariaLabel?: string;
  code: string;
  onCodeChange: (nextCode: string) => void;
}

type EditorTheme = "dark" | "light";

const EDITOR_TAB_SIZE = 4;
const EDITOR_INDENT = " ".repeat(EDITOR_TAB_SIZE);

const editorLayoutExtension = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-editor": {
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily:
      "var(--font-geist-mono), Consolas, 'Liberation Mono', monospace",
    lineHeight: "22px",
    overflow: "auto",
    scrollbarWidth: "thin",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "0 12px 12px",
  },
  ".cm-gutters": {
    minHeight: "100%",
  },
  ".cm-focused": {
    outline: "none",
  },
});

const darkThemeExtension = [
  oneDark,
  EditorView.theme(
    {
      ".cm-activeLine": {
        backgroundColor: "rgba(96, 165, 250, 0.22)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(96, 165, 250, 0.28)",
        color: "#f8fafc",
        fontWeight: "700",
      },
    },
    { dark: true },
  ),
];

const lightThemeExtension = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#111827",
    },
    ".cm-content": {
      caretColor: "#1a237e",
    },
    ".cm-gutters": {
      backgroundColor: "#f8fafc",
      borderRight: "1px solid #e2e8f0",
      color: "#64748b",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(26, 35, 126, 0.18)",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(79, 70, 229, 0.18)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(79, 70, 229, 0.24)",
      color: "#1a237e",
      fontWeight: "700",
    },
  },
  { dark: false },
);

function getThemeExtension(isDarkTheme: boolean): Extension {
  return isDarkTheme ? darkThemeExtension : lightThemeExtension;
}

const insertSpacesForTab: Command = ({ state, dispatch }) => {
  if (state.readOnly) {
    return false;
  }

  const transaction = state.changeByRange((range) => ({
    changes: {
      from: range.from,
      insert: EDITOR_INDENT,
      to: range.to,
    },
    range: EditorSelection.cursor(range.from + EDITOR_TAB_SIZE),
  }));

  dispatch(
    state.update(transaction, {
      scrollIntoView: true,
      userEvent: "input.indent",
    }),
  );

  return true;
};

const deleteSpacesForShiftTab: Command = ({ state, dispatch }) => {
  if (state.readOnly) {
    return false;
  }

  const visitedLines = new Set<number>();
  const changes: Array<{ from: number; to: number }> = [];

  for (const range of state.selection.ranges) {
    const fromLine = state.doc.lineAt(range.from);
    const toLine = state.doc.lineAt(range.to);

    for (
      let lineNumber = fromLine.number;
      lineNumber <= toLine.number;
      lineNumber += 1
    ) {
      if (visitedLines.has(lineNumber)) {
        continue;
      }

      visitedLines.add(lineNumber);

      const line = state.doc.line(lineNumber);
      const leadingSpaces = line.text.match(/^ {1,4}/)?.[0].length ?? 0;
      const deleteCount =
        leadingSpaces > 0 ? leadingSpaces : line.text.startsWith("\t") ? 1 : 0;

      if (deleteCount > 0) {
        changes.push({
          from: line.from,
          to: line.from + deleteCount,
        });
      }
    }
  }

  if (changes.length === 0) {
    return true;
  }

  dispatch(
    state.update({
      changes,
      scrollIntoView: true,
      userEvent: "delete.dedent",
    }),
  );

  return true;
};

export default function ProblemCodeMirrorCore({
  ariaLabel = "답안 코드 입력",
  code,
  onCodeChange,
}: ProblemCodeMirrorCoreProps) {
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("dark");
  const [themeCompartment] = useState(() => new Compartment());
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const initialCodeRef = useRef(code);
  const onCodeChangeRef = useRef(onCodeChange);
  const isDarkTheme = editorTheme === "dark";

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    const parent = editorMountRef.current;

    if (!parent) {
      return;
    }

    const state = EditorState.create({
      doc: initialCodeRef.current,
      extensions: [
        themeCompartment.of(getThemeExtension(true)),
        pythonLanguage,
        lineNumbers(),
        highlightSpecialChars(),
        drawSelection(),
        dropCursor(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        EditorView.lineWrapping,
        EditorState.tabSize.of(EDITOR_TAB_SIZE),
        indentUnit.of(EDITOR_INDENT),
        keymap.of([
          { key: "Tab", run: insertSpacesForTab },
          { key: "Shift-Tab", run: deleteSpacesForShiftTab },
        ]),
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
          "aria-multiline": "true",
          role: "textbox",
          spellcheck: "false",
        }),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            onCodeChangeRef.current(update.state.doc.toString());
          }
        }),
        editorLayoutExtension,
      ],
    });
    const editorView = new EditorView({
      state,
      parent,
    });

    editorViewRef.current = editorView;

    return () => {
      editorView.destroy();
      editorViewRef.current = null;
    };
  }, [ariaLabel, themeCompartment]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (!editorView) {
      return;
    }

    editorView.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtension(isDarkTheme)),
    });
  }, [isDarkTheme, themeCompartment]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (!editorView) {
      return;
    }

    const currentCode = editorView.state.doc.toString();

    if (code === currentCode) {
      return;
    }

    editorView.dispatch({
      changes: {
        from: 0,
        insert: code,
        to: currentCode.length,
      },
    });
  }, [code]);

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

      <div className="box-border h-full pt-12" ref={editorMountRef} />
    </div>
  );
}
