import { useState, useRef, useEffect } from "react";
import { Mic, Send, Image as ImageIcon, X } from "lucide-react";
import { processAudio, streamText } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  sessionId: string;
  messages: any[];
  setMessages: any;
  onUpdateAnalytics: () => void;
}

export default function ChatInterface({ sessionId, messages, setMessages, onUpdateAnalytics }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioSubmit(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await processAudio(audioBlob, messages, sessionId, selectedImage || undefined);
      
      const qText = decodeURIComponent(res.headers['x-query-text'] || "Voice input");
      const rText = decodeURIComponent(res.headers['x-response-text'] || "Response");
      
      setMessages((prev: any) => [
        ...prev,
        { role: 'user', content: qText },
        { role: 'assistant', content: rText }
      ]);

      const audioUrl = URL.createObjectURL(res.audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      onUpdateAnalytics();
    } catch (error) {
      console.error("Audio processing failed", error);
    } finally {
      setIsProcessing(false);
      removeImage();
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const query = inputText.trim();
    setInputText("");
    
    setMessages((prev: any) => [...prev, { role: 'user', content: query }]);
    setIsProcessing(true);
    setMessages((prev: any) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await streamText(query, messages, (chunk) => {
        setMessages((prev: any) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex].content += chunk;
          return newMessages;
        });
      });
      onUpdateAnalytics();
    } catch (error) {
      console.error("Text processing failed", error);
      setMessages((prev: any) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "I encountered an error. Please try again.";
        return newMessages;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 relative">
      <div className="flex-1 overflow-y-auto space-y-6 pb-24 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              NEXUS ELITE
            </h1>
            <p className="text-gray-400 max-w-md">How can I assist you today? Use voice, text, or upload an image for analysis.</p>
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
              <button onClick={() => setInputText("What's the weather like in Tokyo?")} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300">🌤️ Local Weather</button>
              <button onClick={() => setInputText("Give me the latest news headlines")} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300">📰 Latest News</button>
              <button onClick={() => setInputText("Explain quantum computing simply")} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300">🔍 Explain AI</button>
              <button onClick={() => document.getElementById('image-upload')?.click()} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300">🎨 Analyze Image</button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={cn(
                "max-w-[85%] rounded-2xl p-4 glass-card",
                msg.role === "user" ? "ml-auto bg-gradient-to-br from-blue-600/50 to-indigo-600/50 border-blue-500/30" : "mr-auto bg-white/5"
              )}
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))
        )}
        
        {isProcessing && !isRecording && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto glass-card rounded-2xl p-4 flex items-center gap-2">
             <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
             <span className="text-sm text-gray-400 uppercase tracking-widest ml-2">Nexus is thinking</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto">
        <AnimatePresence>
          {previewUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-2 relative inline-block">
              <img src={previewUrl} alt="Preview" className="h-24 rounded-lg border border-white/20 shadow-lg object-cover" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleTextSubmit} className="relative flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Nexus..."
              disabled={isProcessing || isRecording}
              className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md"
            />
            
            <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleImageSelect} />
            <button
              type="button"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              disabled={isProcessing || isRecording}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {inputText.trim() ? (
            <button
              type="submit"
              disabled={isProcessing || isRecording}
              className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity text-white shadow-lg disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing}
              className={cn(
                "p-4 rounded-full transition-all text-white shadow-lg disabled:opacity-50",
                isRecording ? "bg-red-500 animate-pulse scale-110 shadow-red-500/50" : "bg-white/10 border border-white/20 hover:bg-white/20"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
        {isRecording && <p className="text-center text-red-400 text-xs mt-2 font-semibold">Recording... Release to send</p>}
      </div>
    </div>
  );
}
