import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./chat.css";
import Loading from "./loading/Loading";
import Sidebar from "./sidebar/Sidebar";


const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen,setIsOpen]=useState(false);
  const [refersh,setRefresh]=useState(0);
  const endRef = useRef(null);
 

  const [sessionId, setSessionId] = useState(() => {
  let storedSession = localStorage.getItem("sessionId");

  if (!storedSession) {
    storedSession = uuidv4();
    localStorage.setItem("sessionId", storedSession);
  }

  return storedSession;
});


  useEffect(() => {
    if (!sessionId) return;

    fetch(`http://localhost:5000/api/conversations/${sessionId}`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error("Fetch error:", err));
  }, [sessionId,refersh]);

 
  const sendMessage = async () => {
    setMessage("");
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message
        })
      });

      const data = await res.json();

      const assistantMessage = {
        role: "assistant",
        content: data.reply
      };

      setMessages(prev => [...prev, assistantMessage]);
      setMessage("");
    } catch (error) {
      console.error("Chat error:", error);
    }

    setLoading(false);
  };


  const newChat = () => {
    const newSession = uuidv4();
    localStorage.setItem("sessionId", newSession);
    setSessionId(newSession);
    setRefresh(prev=>prev+1);
    setMessages([]);
  };
   const toggleSidebar = () => {
    setRefresh(prev=>prev+1);
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div style={{ width: "900px", margin: "40px auto" }} className="chat-div">
    <Sidebar refresh={refersh} setRefresh={setRefresh}  isOpen={isOpen} onSelectSession={setSessionId}/>
    <svg className="menu-bar" onClick={()=>toggleSidebar()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
      <div className="title-div">
      <h2>AI Support Assistant</h2>
      </div>

      <div className="chat-box" style={{
        width:"36rem",
          border: "1px solid #cccccc94",
          height: "350px",
          overflowY: "auto",
          padding: "10px",
          marginTop: "10px"
      }}>
        {messages.map((msg, index) => (
          <div className="message-box" key={index} style={{ marginBottom: "10px",alignSelf:`${msg.role=="user"?"end":"start"}`}}>
            <strong style={{color:`${msg.role=="user"? "green":"red"}`,alignSelf:`${msg.role=="user"?"end":"start"}`}}>{msg.role === "user" ? "You" : "Assistant"}</strong>
            <div><span>{msg.content}</span></div>
          </div>
        ))}

        {loading && <Loading/>}
        <div ref={endRef}></div>
      </div>

      <div style={{ marginTop: "10px" }} className="input-div">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ width: "85%" }}
        />
        <div>
        <button onClick={sendMessage} className="btns">
          Send
        </button>
      <button className="btns" onClick={newChat}>New Chat</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;