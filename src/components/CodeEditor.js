import React, { useRef, useState, useEffect, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import { Play, Copy, Lock, Minimize2, GripHorizontal, Trash2 } from 'lucide-react';
import styles from './CodeEditor.module.css';
import axios from "axios";
import withWindowLogic from "./withWindowLogic";
import { useAwareness } from "../utils/useYjs";

const SUPPORTED_LANGUAGES = [
  'python', 'java', 'cpp', 'csharp', 'c'
];

function pickColor(name) {
  const palette = [
    '#e6194b','#3cb44b','#4363d8','#f58231','#911eb4',
    '#46f0f0','#f032e6','#008080','#e6beff','#800000',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const CodeEditor = ({
  value, currentUserName, roomId, toggleMinimize, isCreator,
  handleCopy, handleTitleChange, toggleLock, handleDelete,
  windowsMap, awareness,
}) => {
  const [language, setLanguage] = useState('python');
  const [isDark, setIsDark] = useState(true);
  const [output, setOutput] = useState('');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const remoteUsers = useAwareness(awareness, value.id);

  const languageSettings = {
    python: { fileName: 'main.py', version: '3.10.0' },
    java: { fileName: 'Main.java', version: '15.0.2' },
    csharp: { fileName: 'Program.cs', version: '9.0' },
    cpp: { fileName: 'main.cpp', version: '10.2.0' },
    c: { fileName: 'main.c', version: '10.2.0' },
  };

  // Set user info on awareness
  useEffect(() => {
    if (awareness && currentUserName) {
      awareness.setLocalStateField('user', {
        name: currentUserName,
        color: pickColor(currentUserName),
      });
    }
  }, [awareness, currentUserName]);

  // Broadcast cursor position from Monaco
  const broadcastCursor = useCallback(() => {
    if (!awareness || !editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    if (!selection) return;

    // Monaco uses 1-based line/column; convert to offset
    const model = editor.getModel();
    if (!model) return;

    const anchor = model.getOffsetAt({ lineNumber: selection.startLineNumber, column: selection.startColumn });
    const head = model.getOffsetAt({ lineNumber: selection.endLineNumber, column: selection.endColumn });

    awareness.setLocalStateField('cursor', {
      windowId: value.id,
      anchor,
      head,
      // Also send line/col for Monaco rendering on remote side
      startLine: selection.startLineNumber,
      startCol: selection.startColumn,
      endLine: selection.endLineNumber,
      endCol: selection.endColumn,
    });
  }, [awareness, value.id]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for cursor changes
    editor.onDidChangeCursorPosition(() => broadcastCursor());
    editor.onDidChangeCursorSelection(() => broadcastCursor());
  };

  // Render remote cursors as Monaco decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !editor.getModel()) return;

    // Inject dynamic CSS for each remote user color
    remoteUsers.forEach(({ clientId, user }) => {
      const color = user.color || '#888';
      const id = `remote-cursor-${clientId}`;
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
          .remote-cursor-${clientId} {
            background: ${color};
            width: 2px !important;
            margin-left: -1px;
          }
          .remote-cursor-${clientId}::after {
            content: '${user.name || 'User'}';
            position: absolute;
            top: -18px;
            left: 0;
            background: ${color};
            color: #fff;
            font-size: 11px;
            padding: 1px 5px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
          }
          .remote-selection-${clientId} {
            background: ${color}33;
          }
        `;
        document.head.appendChild(style);
      }
    });

    const decorations = [];
    remoteUsers.forEach(({ clientId, user, cursor }) => {
      if (cursor.startLine == null) return; // No Monaco-style positions

      // Cursor line decoration
      decorations.push({
        range: new monaco.Range(cursor.endLine, cursor.endCol, cursor.endLine, cursor.endCol),
        options: {
          className: `remote-cursor-${clientId}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Selection highlight
      if (cursor.startLine !== cursor.endLine || cursor.startCol !== cursor.endCol) {
        decorations.push({
          range: new monaco.Range(cursor.startLine, cursor.startCol, cursor.endLine, cursor.endCol),
          options: {
            className: `remote-selection-${clientId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [remoteUsers]);

  const handleEditorChange = () => {
    const newContent = editorRef.current.getValue();
    if (windowsMap) {
      const yWindow = windowsMap.get(value.id);
      if (yWindow) yWindow.set('content', newContent);
    }
    setTimeout(broadcastCursor, 0);
  };

  const executeCode = async () => {
    const code = editorRef.current.getValue();
    const { fileName, version } = languageSettings[language];
    const program = {
      language, version,
      files: [{ name: fileName, content: code }],
    };
    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', program, {
        headers: { 'Content-Type': 'application/json' },
      });
      setOutput(response.data.run.output);
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('Error executing code');
    }
  };



  return (

    <div className={styles.editor}>
      <div className={styles.titleBar}>
        <GripHorizontal className={`${styles.dragHandle} drag-handle`} size={16} />
        <div className={styles.title} contentEditable suppressContentEditableWarning onBlur={handleTitleChange} ><span>{value?.title}</span></div>

        <div className={styles.controls}>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`${styles.control} ${isDark ? styles.active : ''}`}
            title="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => toggleLock()}
            className={`${styles.control} ${value.locked ? styles.active : ''}`}
            title="Lock editor"
          >
            <Lock size={16} />
          </button>
          <button
            onClick={handleCopy}
            className={styles.control}
            title="Copy code"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleDelete}
            className={styles.control}
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={toggleMinimize}
            className={styles.control}
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>


      <>
        <div className={styles.toolbar}>
          <select
            className={styles.languageSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={executeCode}
            className={styles.runButton}
          >
            <Play size={14} /> Run
          </button>
        </div>

        <div className={styles.editorContainer}>
          <Editor
            language={language}
            value={value?.content}
            theme={isDark ? 'vs-dark' : 'light'}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              readOnly: !isCreator && value.locked,
              automaticLayout: true,
            }}
          />
        </div>


        {output && (
          <div className={styles.output}>
            <pre>{output}</pre>
          </div>
        )}

      </>

    </div>

  );
};

export const Code = withWindowLogic(CodeEditor);