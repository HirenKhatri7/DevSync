import React, { useRef, useState, useEffect, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { Play, Copy, Lock, Minimize2, GripHorizontal, Trash2 } from 'lucide-react';
import styles from './CodeEditor.module.css';
import axios from "axios";
import withWindowLogic from "./withWindowLogic";

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
  const bindingRef = useRef(null);

  const yText = value.yText;

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

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // y-monaco binding: handles Y.Text <-> Monaco sync + remote cursors automatically
    if (yText && awareness) {
      // Destroy previous binding if any
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awareness
      );
    }
  }, [yText, awareness]);

  // Cleanup binding on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  const executeCode = async () => {
    const code = editorRef.current?.getValue() || '';
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
        <div className={styles.title} contentEditable suppressContentEditableWarning onBlur={handleTitleChange}>
          <span>{value?.title}</span>
        </div>
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
          <button onClick={handleCopy} className={styles.control} title="Copy code">
            <Copy size={16} />
          </button>
          <button onClick={handleDelete} className={styles.control} title="Delete">
            <Trash2 size={16} />
          </button>
          <button onClick={toggleMinimize} className={styles.control} title="Minimize">
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
          <button onClick={executeCode} className={styles.runButton}>
            <Play size={14} /> Run
          </button>
        </div>

        <div className={styles.editorContainer}>
          <Editor
            language={language}
            defaultValue=""
            theme={isDark ? 'vs-dark' : 'light'}
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