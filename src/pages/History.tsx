import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Calendar, FileText, AlertTriangle, ShieldCheck, ChevronRight, MessageSquare, Search } from "lucide-react";

const History = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "requests"),
            where("userId", "==", user.uid)
            // orderBy("createdAt", "desc") // Client-side sort to avoid index issues with compound query
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a: any, b: any) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
                return dateB - dateA;
            });
            setRequests(data);
            setLoading(false);
        }, (error) => {
            console.error("History fetch error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredRequests = requests.filter(req =>
        req.cropCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.diagnosis?.problemType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            <main className="max-w-3xl mx-auto p-6 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by crop or disease..."
                        className="farmer-input pl-12 h-14"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 w-full bg-white rounded-3xl animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            {req.image ? (
                                                <img src={req.image} className="h-full w-full object-cover rounded-2xl" />
                                            ) : (
                                                <MessageSquare className="h-7 w-7 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                    {req.cropCategory}
                                                </span>
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Calendar className="h-3 w-3" />
                                                    <span className="text-[10px]">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                                                {req.diagnosis?.problemType || "General Inquiry"}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-1 italic">
                                                "{req.description || "No description provided"}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 ${req.diagnosis?.riskLevel === "High" ? "bg-red-50 text-red-600" :
                                            req.diagnosis?.riskLevel === "Medium" ? "bg-yellow-50 text-yellow-600" :
                                                "bg-green-50 text-green-600"
                                            }`}>
                                            {req.diagnosis?.riskLevel === "High" ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                            {req.diagnosis?.riskLevel} Risk
                                        </div>
                                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {req.status === 'Escalated' && (
                                    <div className="mt-3 inline-block">
                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg uppercase tracking-wider">
                                            Escalated to High Authority
                                        </span>
                                    </div>
                                )}

                                {req.reply && (
                                    <div className="mt-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in fade-in">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                                                Ex
                                            </div>
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Expert Reply</p>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium">
                                            "{req.reply}"
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cause</p>
                                        <p className="text-sm text-slate-700">{req.diagnosis?.possibleCause}</p>
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Recommendation</p>
                                        <p className="text-sm text-slate-700 font-medium">{req.diagnosis?.recommendedAction}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No records yet</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Your crop diagnoses and AI chats will be saved here automatically.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-8 farmer-btn inline-flex items-center gap-2 px-8"
                        >
                            Start First Diagnosis
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default History;
