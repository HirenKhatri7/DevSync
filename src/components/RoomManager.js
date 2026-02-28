import React, { useState } from "react";
import styles from "./RoomManager.module.css";
import JoinCreateCard from "./JoinCreateCard";

const RoomManager = ({ onRoomJoin }) => {
  const [cardType, setCardType] = useState("Join");

  return (
    <div className={styles.mainContent}>
      <div className={styles.roomCard}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">sync_alt</span>
          </div>
          <h2 className={styles.brandName}>DevSync</h2>
          <p className={styles.subtitle}>Real-time collaborative editing</p>
        </div>

        {/* Segmented Toggle */}
        <div className={styles.segmentedToggle}>
          <button
            className={`${styles.segmentBtn} ${cardType === "Join" ? styles.active : ""}`}
            onClick={() => setCardType("Join")}
          >
            Join Room
          </button>
          <button
            className={`${styles.segmentBtn} ${cardType === "Create" ? styles.active : ""}`}
            onClick={() => setCardType("Create")}
          >
            Create Room
          </button>
        </div>

        {/* Form */}
        <JoinCreateCard onRoomJoin={onRoomJoin} type={cardType} />
      </div>

      <p className={styles.pageFooter}>
        under development — <a href="https://github.com/HirenKhatri7/DevSync">report issues on GitHub</a>
      </p>
    </div>
  );
};

export default RoomManager;
