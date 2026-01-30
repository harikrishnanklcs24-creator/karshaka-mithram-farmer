import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Send, Users, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Community = () => {
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (!userData?.district) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "messages"),
            where("district", "==", userData.district)
            // orderBy("createdAt", "asc") - Removed to avoid index requirement for new collections
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort to avoid composite index requirement
            msgs.sort((a: any, b: any) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return a.createdAt.seconds - b.createdAt.seconds;
            });

            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Chat Error:", error);
            toast.error("Error loading chat: " + error.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !userData?.district) return;

        try {
            await addDoc(collection(db, "messages"), {
                text: newMessage,
                userId: user.uid,
                userName: userData.name || "Farmer",
                district: userData.district,
                createdAt: serverTimestamp()
            });
            setNewMessage("");
        } catch (error) {
            console.error("Send Error:", error);
            toast.error("Failed to send message");
        }
    };

    if (!userData?.district) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">District Not Found</h2>
                    <p className="text-slate-500">Please update your profile with your district to join the community chat.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-slate-50/50 animate-fade-in flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-xl">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900">{userData.district} Community</h1>
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider">{messages.length} Messages</p>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No messages yet. Be the first to say hello!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.userId === user?.uid;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe
                                        ? "bg-primary text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 rounded-tl-none"
                                        }`}>
                                        <p className={`text-xs font-bold mb-1 ${isMe ? "text-green-100" : "text-green-600"}`}>
                                            {msg.userName}
                                        </p>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 lg:pl-72">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask a question or share advice..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-primary text-white p-4 rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-green-200"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Community;
