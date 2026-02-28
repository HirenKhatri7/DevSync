import React, { useState } from "react";
import DraggableComponent from "./DraggableComponent";

const withWindowLogic = (WindowedComponent) => {
    return (props) => {
        const { value, currentUserName, roomId, toggleMinimize, windowsMap } = props;
        const [title, setTitle] = useState(value.title);
        const isCreator = value.creator === currentUserName;

        // Get the Y.Map for this window
        const getYWindow = () => windowsMap && windowsMap.get(value.id);

        const handleCopy = () => {
            const yWindow = getYWindow();
            const yText = yWindow && yWindow.get('content');
            const text = yText && typeof yText.toString === 'function' ? yText.toString() : (value?.content || '');
            navigator.clipboard.writeText(text);
        };

        const handleDelete = () => {
            if (!isCreator) {
                alert("You cannot delete this window.");
                return;
            }
            if (windowsMap) {
                windowsMap.delete(value.id);
            }
        };

        const toggleLock = () => {
            if (!isCreator) {
                alert("Only the creator can change the lock status.");
                return;
            }
            const yWindow = getYWindow();
            if (yWindow) {
                yWindow.set('locked', !value.locked);
            }
        };

        const handleTitleChange = (event) => {
            const newTitle = event.target.firstChild?.textContent || '';
            setTitle(newTitle);
            const yWindow = getYWindow();
            if (yWindow) {
                yWindow.set('title', newTitle);
            }
        };

        return (
            <DraggableComponent handle=".drag-handle">
                <WindowedComponent
                    {...props}
                    isCreator={isCreator}
                    handleDelete={handleDelete}
                    toggleLock={toggleLock}
                    handleTitleChange={handleTitleChange}
                    handleCopy={handleCopy}
                    title={title}
                />
            </DraggableComponent>
        );
    };
};

export default withWindowLogic;