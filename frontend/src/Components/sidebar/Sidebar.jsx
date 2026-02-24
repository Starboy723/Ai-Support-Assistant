import { useState, useEffect} from "react";
import "./sidebar.css";

function Sidebar({ onSelectSession,isOpen,refresh,setRefresh}) {
  const [sessions, setSessions] = useState([]);
  
  // Fetch sessions from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/sessions")
      .then(res => res.json())
      .then(data => setSessions(data))
      .catch(err => console.error(err));
  }, [refresh]);

  async function deleteSessions(){
    setRefresh(prev=>prev+1);
    try{
     await fetch("http://localhost:5000/api/sessions", {
      method: "DELETE"
    });
  }
  catch(err){ 
    console.log(err);
   }
  }
  return (
    <div  style={{ width: "200px", padding: "10px"}} className={`sidebar-container ${isOpen ? "open" : "close"}`}>
      <ul style={{ listStyle: "none", padding: 0 }} className="session-list">
        {sessions.map((session,index) => (
          <li key={session.id} className="list-item">
            <button
              onClick={() => onSelectSession(session.id)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <span style={{fontSize:"1.1rem"}}>session{index+1}</span>
              <br></br>
              <br></br>
              {new Date(session.updated_at).toLocaleString()}
            </button>
          </li>
        ))}
      </ul>
      {sessions.length>0 && <img onClick={()=>deleteSessions()} className="delete-icon" src="/delete.png" alt="delete" width={30} height={30}></img>}
    </div>
  );
}

export default Sidebar;