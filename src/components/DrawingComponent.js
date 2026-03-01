import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawBinding, yjsToExcalidraw } from "y-excalidraw";
import * as Y from "yjs";
import styles from "./Window.module.css";
import withWindowLogic from "./withWindowLogic";
import { useState, useRef, useEffect } from "react";
import { Copy, Minimize2, Trash2, Lock, GripHorizontal } from 'lucide-react';
const DrawingComponent = ({
    value,
    toggleMinimize,
    isCreator,
    toggleLock,
    handleDelete,
    handleTitleChange,
    awareness,
    windowsMap,
  synced,
}) => {
    const excalidrawRef = useRef(null);
  const [api, setApi] = useState(null);
  const bindingRef = useRef(null);
  const [initialData, setInitialData] = useState(null);

  const yWindow = windowsMap?.get(value.id);
  const yElements = yWindow?.get("elements");
  const yAssets = yWindow?.get("assets");
  const isLocked =true;

  // In React StrictMode, components mount/unmount twice in dev.
  // Excalidraw starts with an empty scene unless we explicitly seed it.
  // If we create the binding too early, that empty scene can be written into Yjs.
  useEffect(() => {
    if (!synced || !yElements) return;
    // Only set once per mount; after that the binding keeps things in sync.
    if (initialData) return;
    setInitialData({ elements: yjsToExcalidraw(yElements) });
    console.log(value);
  }, [synced, yElements, initialData]);

  useEffect(() => {
    // Wait for initial Yjs sync; otherwise a joining client can accidentally
    // publish an empty initial Excalidraw scene into the shared Yjs doc.
    if (!synced) return;
    if (!initialData) return;
    if (!api || !yElements || !yAssets || !awareness) return;

    const undoManager = new Y.UndoManager(yElements);

    bindingRef.current = new ExcalidrawBinding(
      yElements,
      yAssets,
      api,
      awareness,
      {
        excalidrawDom: excalidrawRef.current,
        undoManager,
      }
    );

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [api, yElements, yAssets, awareness, synced, initialData]);

  

  return (
    <div className={styles.window}>
      {/* Title bar same as Text */}
      <div className={styles.titleBar}>
        <GripHorizontal className={`${styles.dragHandle} drag-handle`} size={16} />
        <div
          className={styles.title}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleChange}
        >
          {value?.title}
        </div>
        <div className={styles.controls}>
          <button onClick={toggleLock} className={`${styles.control} ${value.locked ? styles.active : ''}`} title="Lock"><Lock size={16} /></button>
          <button onClick={handleDelete} className={styles.control} title="Delete">
            <Trash2 size={16} />
          </button>
          <button onClick={toggleMinimize} className={styles.control} title="Minimize">
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      <div
        ref={excalidrawRef}
        style={{ height: "500px", width: "100%" }}
      >
        {initialData && (
          <Excalidraw initialData={initialData} excalidrawAPI={setApi} />
        )}
      </div>
    </div>
  );
};

export default withWindowLogic(DrawingComponent);