
import "./Sidebar.css";


const Sidebar = ({isOpen,windows,onRestore,toggleSidebar}) => {

  

  

  return (
    <div>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <h2>Windows</h2>
        <ul>
        {
            windows.map((data) =>(
            <li key={data.id}>
            <button onClick={() =>{ 
                onRestore(data.id)
                toggleSidebar()

            }}>{data.title}</button>
          </li>
            ))
        }
        </ul>  
      </div>
    </div>
  );
};

export default Sidebar;
