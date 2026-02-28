import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { QuillBinding } from 'y-quill';
import 'quill/dist/quill.snow.css';
import withWindowLogic from './withWindowLogic';
import styles from './Window.module.css';
import { Copy, Minimize2, Trash2, Lock, GripHorizontal } from 'lucide-react';

// Register the cursors module once
Quill.register('modules/cursors', QuillCursors);

function pickColor(name) {
  const palette = [
    '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
    '#46f0f0', '#f032e6', '#008080', '#e6beff', '#800000',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const TextComponent = ({
  value, currentUserName, roomId, toggleMinimize, isCreator,
  handleCopy, handleDelete, handleTitleChange, toggleLock,
  windowsMap, awareness,
}) => {
  const quillContainerRef = useRef(null);
  const quillRef = useRef(null);
  const bindingRef = useRef(null);

  const yText = value.yText;

  // Set user info on awareness
  useEffect(() => {
    if (awareness && currentUserName) {
      awareness.setLocalStateField('user', {
        name: currentUserName,
        color: pickColor(currentUserName),
      });
    }
  }, [awareness, currentUserName]);

  // Initialize Quill and bind to Y.Text
  useEffect(() => {
    const container = quillContainerRef.current;
    if (!container) return;

    // Create a fresh editor div (handles React StrictMode double-mount)
    container.innerHTML = '';
    const editorDiv = document.createElement('div');
    container.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: {
        cursors: true,
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ],
        history: {
          userOnly: true, // Only track local changes for undo/redo
        },
      },
      placeholder: 'Start writing...',
    });

    quillRef.current = quill;

    // Create y-quill binding: handles Y.Text <-> Quill sync + remote cursors
    if (yText && awareness) {
      bindingRef.current = new QuillBinding(yText, quill, awareness);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      quillRef.current = null;
      container.innerHTML = '';
    };
  }, [yText, awareness]);

  // Handle lock state
  useEffect(() => {
    if (quillRef.current) {
      const isLocked = !isCreator && value.locked;
      quillRef.current.enable(!isLocked);
    }
  }, [value.locked, isCreator]);

  return (
    <div className={styles.window}>
      {/* Title bar */}
      <div className={styles.titleBar}>
        <GripHorizontal className={`${styles.dragHandle} drag-handle`} size={16} />
        <div className={styles.title} contentEditable suppressContentEditableWarning onBlur={handleTitleChange}>
          <span>{value?.title}</span>
        </div>
        <div className={styles.controls}>
          <button onClick={() => toggleLock()} className={`${styles.control} ${value.locked ? styles.active : ''}`} title="Lock">
            <Lock size={16} />
          </button>
          <button onClick={handleCopy} className={styles.control} title="Copy">
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

      {/* Quill editor container */}
      <div className={styles.quillContainer}>
        <div ref={quillContainerRef} />
      </div>
    </div>
  );
};

const Text = withWindowLogic(TextComponent);
export default Text;