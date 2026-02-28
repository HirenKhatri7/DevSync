import React, { useState, useRef, useEffect, useCallback } from 'react';
import withWindowLogic from './withWindowLogic';
import styles from './Window.module.css';
import { Copy, Minimize2, Trash2, Lock, GripHorizontal } from 'lucide-react';
import { useAwareness } from '../utils/useYjs';

/**
 * Measure pixel coordinates for a character index inside a textarea.
 * Creates a hidden mirror div that replicates the textarea's styling.
 */
function getCaretCoordinates(textarea, position) {
  if (!textarea) return { top: 0, left: 0 };

  const mirror = document.createElement('div');
  const computed = window.getComputedStyle(textarea);

  // Copy relevant styles
  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'wordSpacing', 'textIndent', 'paddingTop', 'paddingRight', 'paddingBottom',
    'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
    'borderLeftWidth', 'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap', 'width',
  ];
  props.forEach((p) => { mirror.style[p] = computed[p]; });
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  document.body.appendChild(mirror);

  const text = textarea.value.substring(0, position);
  mirror.textContent = text;

  const span = document.createElement('span');
  span.textContent = textarea.value.substring(position) || '.';
  mirror.appendChild(span);

  const top = span.offsetTop - textarea.scrollTop;
  const left = span.offsetLeft;

  document.body.removeChild(mirror);
  return { top, left };
}


const TextComponent = ({
  value, currentUserName, roomId, toggleMinimize, isCreator,
  handleCopy, handleDelete, handleTitleChange, toggleLock,
  windowsMap, awareness,
}) => {
  const [textContent, setTextContent] = useState(value?.content || '');
  const textareaRef = useRef(null);
  const remoteUsers = useAwareness(awareness, value.id);

  // Set local user info on awareness once
  useEffect(() => {
    if (awareness && currentUserName) {
      const existing = awareness.getLocalState();
      if (!existing || !existing.user || existing.user.name !== currentUserName) {
        awareness.setLocalStateField('user', {
          name: currentUserName,
          color: pickColor(currentUserName),
        });
      }
    }
  }, [awareness, currentUserName]);

  // Broadcast caret / selection to awareness
  const broadcastCursor = useCallback(() => {
    if (!awareness || !textareaRef.current) return;
    const ta = textareaRef.current;
    awareness.setLocalStateField('cursor', {
      windowId: value.id,
      anchor: ta.selectionStart,
      head: ta.selectionEnd,
    });
  }, [awareness, value.id]);

  const handleTextChange = (e) => {
    const content = e.target.value;
    setTextContent(content);
    if (windowsMap) {
      const yWindow = windowsMap.get(value.id);
      if (yWindow) yWindow.set('content', content);
    }
    // Broadcast cursor on next tick so selectionStart is updated
    setTimeout(broadcastCursor, 0);
  };

  const handleSelect = () => broadcastCursor();
  const handleClick = () => broadcastCursor();
  const handleKeyUp = () => broadcastCursor();

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
          <button onClick={handleDelete} className={styles.control} title="Clear">
            <Trash2 size={16} />
          </button>
          <button onClick={toggleMinimize} className={styles.control} title="Minimize">
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Textarea wrapper — needed for positioning overlays */}
      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value?.content ?? textContent}
          onChange={handleTextChange}
          onSelect={handleSelect}
          onClick={handleClick}
          onKeyUp={handleKeyUp}
          disabled={!isCreator && value.locked}
          placeholder="Start Writing"
        />

        {/* Remote carets & selections */}
        {remoteUsers.map(({ clientId, user, cursor }) => {
          const ta = textareaRef.current;
          if (!ta) return null;

          const anchorPos = getCaretCoordinates(ta, cursor.anchor);
          const headPos = getCaretCoordinates(ta, cursor.head);
          const color = user.color || '#888';
          const lineHeight = parseFloat(window.getComputedStyle(ta).lineHeight) || 20;

          return (
            <React.Fragment key={clientId}>
              {/* Selection highlight (only if anchor !== head) */}
              {cursor.anchor !== cursor.head && (
                <div
                  className={styles.remoteSelection}
                  style={{
                    top: Math.min(anchorPos.top, headPos.top),
                    left: Math.min(anchorPos.left, headPos.left),
                    width: Math.abs(headPos.left - anchorPos.left) || 4,
                    height: Math.abs(headPos.top - anchorPos.top) + lineHeight,
                    backgroundColor: color,
                    opacity: 0.2,
                  }}
                />
              )}

              {/* Caret line */}
              <div
                className={styles.remoteCaret}
                style={{
                  top: headPos.top,
                  left: headPos.left,
                  height: lineHeight,
                  backgroundColor: color,
                }}
              />

              {/* Username label */}
              <div
                className={styles.remoteCaretLabel}
                style={{
                  top: headPos.top - 18,
                  left: headPos.left,
                  backgroundColor: color,
                }}
              >
                {user.name}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

function pickColor(name) {
  const palette = [
    '#e6194b','#3cb44b','#4363d8','#f58231','#911eb4',
    '#46f0f0','#f032e6','#008080','#e6beff','#800000',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const Text = withWindowLogic(TextComponent);
export default Text;