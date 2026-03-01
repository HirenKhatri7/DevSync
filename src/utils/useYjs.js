import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const WS_URL = process.env.REACT_APP_YJS_WS_URL || (
  window.location.protocol === 'https:'
    ? `wss://${window.location.host}/yjs`
    : 'ws://localhost:4000/yjs'
);

/**
 * Hook that connects to the Yjs WebSocket server for a given room.
 * Returns { ydoc, provider, awareness, windowsMap, connected, synced }
 */
export function useYjs(roomId) {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [windowsMap, setWindowsMap] = useState(null);
  const [awareness, setAwareness] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(WS_URL, roomId, ydoc, {
      connect: true,
    });
    providerRef.current = provider;

    provider.on('status', ({ status }) => {
      setConnected(status === 'connected');
    });

    // Important for bindings like y-excalidraw: avoid pushing an empty initial scene
    // before we have received the authoritative remote state.
    provider.on('sync', (isSynced) => {
      setSynced(Boolean(isSynced));
    });

    const wMap = ydoc.getMap('windows');
    setWindowsMap(wMap);
    setAwareness(provider.awareness);

    return () => {
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setWindowsMap(null);
      setAwareness(null);
      setConnected(false);
      setSynced(false);
    };
  }, [roomId]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    awareness,
    windowsMap,
    connected,
    synced,
  };
}

/**
 * Hook that observes the top-level windows Y.Map and returns
 * a plain JS array of window objects (re-renders on every change).
 */
export function useYjsWindows(windowsMap) {
  const [windows, setWindows] = useState([]);

  const sync = useCallback(() => {
    if (!windowsMap) {
      setWindows([]);
      return;
    }

    const result = [];
    windowsMap.forEach((yWindow, id) => {
      if (yWindow instanceof Y.Map) {
        const yText = yWindow.get('content');
        result.push({
          id,
          title: yWindow.get('title') || '',
          content: yText instanceof Y.Text ? yText.toString() : (yText || ''),
          yText: yText instanceof Y.Text ? yText : null,
          creator: yWindow.get('creator') || '',
          locked: yWindow.get('locked') ?? true,
          typeOfNode: yWindow.get('typeOfNode') || 'Text',
        });
      }
    });
    setWindows(result);
  }, [windowsMap]);

  useEffect(() => {
    if (!windowsMap) return;
    sync();
    const observer = () => sync();
    windowsMap.observeDeep(observer);
    return () => windowsMap.unobserveDeep(observer);
  }, [windowsMap, sync]);

  return windows;
}

