import React, { useState } from "react";
import styles from "./RoomManager.module.css";
import api from "../utils/api";

const JoinCreateCard = ({ onRoomJoin, type }) => {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleJoinRoom = async () => {
    if (!roomId || !password) {
      alert("Please enter a Room ID and password.");
      return;
    }
    try {
      await api.post('/rooms/join', { roomId, password });
      onRoomJoin(roomId);
    } catch (error) {
      console.error("Error joining room:", error);
      alert(error.response?.data?.error || "Failed to join room.");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomId || !newPassword) {
      alert("Please enter a new Room ID and password.");
      return;
    }
    try {
      await api.post('/rooms/create', { roomId: newRoomId, password: newPassword });
      onRoomJoin(newRoomId);
    } catch (error) {
      console.error("Error creating room:", error);
      alert(error.response?.data?.error || "Failed to create room.");
    }
  };

  if (type === "Join") {
    return (
      <div className={styles.formGroup}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Room ID</label>
          <div className={styles.inputWrapper}>
            <span className="material-symbols-outlined">tag</span>
            <input
              className={styles.inputField}
              type="text"
              placeholder="e.g. my-project-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Password</label>
          <div className={styles.inputWrapper}>
            <span className="material-symbols-outlined">lock</span>
            <input
              className={styles.inputField}
              type="password"
              placeholder="Room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button className={styles.submitBtn} onClick={handleJoinRoom}>
          <span>Join Session</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </button>
        <p className={styles.footerText}>
          Need to start a new session?{" "}
          <a href="#create" onClick={(e) => { e.preventDefault(); }}>Create Room</a>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.formGroup}>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Room Name</label>
        <div className={styles.inputWrapper}>
          <span className="material-symbols-outlined">tag</span>
          <input
            className={styles.inputField}
            type="text"
            placeholder="e.g. backend-api"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Password</label>
        <div className={styles.inputWrapper}>
          <span className="material-symbols-outlined">lock</span>
          <input
            className={styles.inputField}
            type="password"
            placeholder="Set a room password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </div>
      <button className={styles.submitBtn} onClick={handleCreateRoom}>
        <span>Create Room</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
      </button>
    </div>
  );
};

export default JoinCreateCard;
