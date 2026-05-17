import { X, MessageSquare, Activity, Settings, Plus, Clock, AlertTriangle, LogOut, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { auth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: any;
  analytics: any;
  history: any[];
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  currentSessionId: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  systemStatus,
  analytics,
  history,
  onSelectSession,
  onNewSession,
  currentSessionId
}: SidebarProps) {
  const provider = systemStatus?.providers?.active || "offline";
  const version = systemStatus?.version || "0.0.0";
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Guest login failed", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="fixed md:relative z-40 w-[300px] h-full flex flex-col glass-panel border-r border-white/10"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              💠 CONTROL
            </h1>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full md:hidden">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {user ? (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">{user.displayName || 'Guest'}</span>
                </div>
                <button onClick={() => signOut(auth)} className="text-xs text-red-400 hover:text-red-300">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleGoogleLogin} className="flex-1 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center justify-center gap-1">
                  <LogIn className="w-3 h-3" /> Google
                </button>
                <button onClick={handleGuestLogin} className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 flex items-center justify-center gap-1">
                  <User className="w-3 h-3" /> Guest
                </button>
              </div>
            )}

            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" /> New Session
            </button>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> System Status
              </h3>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Backend</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    v{version}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Active Provider</span>
                  <span className="font-semibold text-blue-400 uppercase">{provider}</span>
                </div>
              </div>
            </div>

            {analytics && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Analytics
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <span className="text-xs text-gray-400">Total Req</span>
                    <span className="text-lg font-bold text-white">{analytics.total_requests}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <span className="text-xs text-gray-400">Avg Latency</span>
                    <span className="text-lg font-bold text-white">{analytics.avg_latency_ms}ms</span>
                  </div>
                </div>
                {analytics.fallbacks > 0 && (
                  <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Fallbacks: {analytics.fallbacks}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Recent Sessions
              </h3>
              <div className="space-y-1">
                {history.length > 0 ? (
                  history.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectSession(s.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors",
                        currentSessionId === s.id ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-gray-300"
                      )}
                    >
                      {s.id.substring(0, 18)}...
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No recent sessions</p>
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

