import { Code } from "./CodeEditor";
import Text from "./text";
import DrawingComponent from "./DrawingComponent";



const ChildrenComponent = ({ value, currentUserName, roomId, TypeOfNode, toggleMinimize, awareness, windowsMap, synced }) => {

    return (
        (() => {
            if (TypeOfNode === "Text") {
                return <Text
                    value={value}
                    currentUserName={currentUserName}
                    roomId={roomId}
                    toggleMinimize={toggleMinimize}
                    awareness={awareness}
                    windowsMap={windowsMap} />
            } else if (TypeOfNode === "Code") {
                return <Code
                    value={value}
                    currentUserName={currentUserName}
                    roomId={roomId}
                    toggleMinimize={toggleMinimize}
                    awareness={awareness}
                    windowsMap={windowsMap} />
            } else if (TypeOfNode === "Drawing") {
                return (
                    <DrawingComponent
                        value={value}
                        currentUserName={currentUserName}
                        roomId={roomId}
                        toggleMinimize={toggleMinimize}
                        awareness={awareness}
                        windowsMap={windowsMap}
                        synced={synced}
                    />
                );
            }
        })()
    );
};

export default ChildrenComponent;
