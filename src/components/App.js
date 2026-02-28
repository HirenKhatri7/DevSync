import React, { useState, useEffect } from "react";
import * as Y from "yjs";
import RoomManager from "./RoomManager";
import ParentComponent from "./ParentComponent";
import ChildrenComponent from "./ChildrenComponent";
import Sidebar from "./Sidebar";
import LongMenu from "./Dropdown";
import '../App.css'
import { socket } from "../utils/Socket";
import { useYjs, useYjsWindows } from "../utils/useYjs";
import axios from "axios";

function App() {

    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [minimizedWindows, setMinimizedWindows] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [selectedType, setSelectedType] = useState("Text");

    const handleOpen = () => setModalOpen(true);
    const handleClose = () => {
        setModalOpen(false);
        setTitle("");
        setSelectedType("Text");
    };
    const menuItems = [
        { name: "Username", value: username },
        { name: "Room ID", value: roomId },
        { name: "Exit", value: "Exit", onClick: () => handleExit() }
    ];
    const [participants, setParticipants] = useState([]);

    // --- Yjs connection ---
    const { windowsMap, awareness, connected } = useYjs(roomId);
    const childrenData = useYjsWindows(windowsMap);
    const windowList = childrenData.map(w => ({ id: w.id, title: w.title, type: w.typeOfNode }));

    // Socket.IO for presence + cursors only (window sync is via Yjs)
    useEffect(() => {
        if (roomId && username) {
            socket.connect();
            socket.emit('joinRoom', roomId);
            socket.emit('registerUsername', { roomId, username });

            socket.on('presence:update', ({ participants }) => {
                setParticipants(participants || []);
            });
        }

        return () => {
            socket.off('presence:update');
            socket.disconnect();
        }
    }, [roomId, username]);



    useEffect(() => {
        const storedRoomId = localStorage.getItem("roomId");
        const storedUsername = localStorage.getItem("username");
        if (storedRoomId && storedUsername) {
            setRoomId(storedRoomId);
            setUsername(storedUsername);
        }
    }, []);



    function createWindow() {
        if (!roomId) {
            alert("First join a room");
            return;
        }
        if (!title.trim()) {
            alert("Please enter a title for the window.");
            return;
        }
        if (!windowsMap) return;

        const windowId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const yWindow = new Y.Map();
        yWindow.set('title', title);
        yWindow.set('content', new Y.Text());
        yWindow.set('creator', username);
        yWindow.set('locked', true);
        yWindow.set('typeOfNode', selectedType);
        windowsMap.set(windowId, yWindow);

        handleClose();
    };

    const handleRoomJoin = async (selectedRoomId) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_URL || ''}/api/username`, { roomId: selectedRoomId });
            const newUsername = response.data.username;

            localStorage.setItem("roomId", selectedRoomId);
            localStorage.setItem("username", newUsername);

            setRoomId(selectedRoomId);
            setUsername(newUsername);
        } catch (error) {
            console.error("Failed to fetch username for new room:", error);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const toggleMinimizeWindow = (id) => {
        setMinimizedWindows((prev) => [...prev, id]);
    };

    const restoreWindow = (id) => {
        setMinimizedWindows((prev) => prev.filter((windowId) => windowId !== id));
    };

    const handleExit = () => {
        localStorage.removeItem("roomId");
        localStorage.removeItem("username");
        setRoomId('');
        setUsername('');
    };



    return (
        <div className="App">
            {!roomId ? (
                <RoomManager onRoomJoin={handleRoomJoin} />
            ) : (
                <div className="workspace">
                    <header className="app-header">
                        <div className="header-left">
                            <button className="header-icon-btn" onClick={toggleSidebar}>
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div className="header-brand">
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync_alt</span>
                                <span className="brand-text">DevSync</span>
                            </div>
                        </div>

                        <div className="header-center">
                            <span className="room-badge">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tag</span>
                                {roomId}
                            </span>
                        </div>

                        <div className="header-right">
                            <div className="avatar-stack">
                                {participants.slice(0, 3).map((p, i) => (
                                    <span
                                        key={p.username}
                                        className="avatar-circle"
                                        style={{ backgroundColor: p.color || '#64748b', zIndex: 3 - i }}
                                        title={p.username}
                                    >
                                        {p.username.charAt(0).toUpperCase()}
                                    </span>
                                ))}
                                {participants.length > 3 && (
                                    <span className="avatar-circle avatar-more">+{participants.length - 3}</span>
                                )}
                            </div>
                            <button className="add-button-header" onClick={handleOpen}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                                Add
                            </button>
                            <LongMenu menuItems={menuItems} />
                        </div>
                    </header>

                    {/* ── Custom Modal ── */}
                    {modalOpen && (
                        <div className="modal-overlay" onClick={handleClose}>
                            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>New Window</h3>
                                    <button className="modal-close-btn" onClick={handleClose}>
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <label className="modal-label">Title</label>
                                <input
                                    className="modal-input"
                                    type="text"
                                    placeholder="Enter window title…"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />

                                <label className="modal-label">Type</label>
                                <div className="modal-type-row">
                                    <button
                                        className={`modal-type-card ${selectedType === "Text" ? "selected" : ""}`}
                                        onClick={() => setSelectedType("Text")}
                                    >
                                        <span className="material-symbols-outlined">description</span>
                                        <span className="type-label">Text Editor</span>
                                        {selectedType === "Text" && (
                                            <span className="material-symbols-outlined check-icon">check_circle</span>
                                        )}
                                    </button>
                                    <button
                                        className={`modal-type-card ${selectedType === "Code" ? "selected" : ""}`}
                                        onClick={() => setSelectedType("Code")}
                                    >
                                        <span className="material-symbols-outlined">code</span>
                                        <span className="type-label">Code Editor</span>
                                        {selectedType === "Code" && (
                                            <span className="material-symbols-outlined check-icon">check_circle</span>
                                        )}
                                    </button>
                                </div>

                                <button className="modal-create-btn" onClick={createWindow}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                                    Create Window
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="content">
                        <Sidebar
                            isOpen={sidebarOpen}
                            windows={windowList}
                            participants={participants}
                            onRestore={restoreWindow}
                            toggleSidebar={toggleSidebar}
                        />

                        <ParentComponent>
                            {childrenData.filter((data) => !minimizedWindows.includes(data.id))
                                .map((data) => (
                                    <ChildrenComponent
                                        key={data.id}
                                        value={data}
                                        currentUserName={username}
                                        roomId={roomId}
                                        TypeOfNode={data.typeOfNode}
                                        toggleMinimize={() => toggleMinimizeWindow(data.id)}
                                        awareness={awareness}
                                        windowsMap={windowsMap}
                                    />
                                ))}
                        </ParentComponent>
                    </div>

                    <footer className="app-footer">
                        <span>DevSync — Under Development</span>
                        <a href="https://github.com/HirenKhatri7/DevSync" target="_blank" rel="noopener noreferrer">
                            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: -2 }}>open_in_new</span> GitHub
                        </a>
                    </footer>
                </div>
            )}
        </div>
    );
}

export default App;
