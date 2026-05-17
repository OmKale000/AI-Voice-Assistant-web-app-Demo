"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { Menu } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { checkHealth, fetchHistory, fetchSessionHistory, fetchAnalytics } from "@/lib/api";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    setSessionId(uuidv4());
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [health, hist, ana] = await Promise.all([
        checkHealth(),
        fetchHistory(),
        fetchAnalytics(),
      ]);
      setSystemStatus(health);
      setHistory(hist.sessions || []);
      setAnalytics(ana);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const data = await fetchSessionHistory(id);
      setMessages(data.messages?.map((m: any) => [
        { role: "user", content: m.query },
        { role: "assistant", content: m.response }
      ]).flat() || []);
      setSessionId(id);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to load session", err);
    }
  };

  const newSession = () => {
    setSessionId(uuidv4());
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        systemStatus={systemStatus}
        analytics={analytics}
        history={history}
        onSelectSession={loadSession}
        onNewSession={newSession}
        currentSessionId={sessionId}
      />
      
      <main className="flex-1 flex flex-col relative h-full">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all shadow-lg text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        <div className="flex-1 overflow-y-auto">
          <ChatInterface 
            sessionId={sessionId} 
            messages={messages} 
            setMessages={setMessages}
            onUpdateAnalytics={loadData}
          />
        </div>
      </main>
    </div>
  );
}
