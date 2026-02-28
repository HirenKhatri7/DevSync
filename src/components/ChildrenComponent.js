import  {Code}  from "./CodeEditor";
import  Text  from "./text";



const ChildrenComponent = ({ value, currentUserName, roomId, TypeOfNode, toggleMinimize, awareness, windowsMap }) => {

    return (
           (() => {
                        if (TypeOfNode === "Text") {
                            return <Text
                            value={value}
                            currentUserName={currentUserName}
                            roomId={roomId}
                            toggleMinimize = {toggleMinimize}
                            awareness={awareness}
                            windowsMap={windowsMap}/>
                        } else if (TypeOfNode === "Code") {
                            return <Code
                            value={value}
                            currentUserName={currentUserName}
                            roomId={roomId}
                            toggleMinimize = {toggleMinimize}
                            awareness={awareness}
                            windowsMap={windowsMap} />
                        }
                    })()
    );
};

export default ChildrenComponent;
