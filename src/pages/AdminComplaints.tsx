import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, AlertOctagon, Phone, Calendar, User, Clock } from "lucide-react";
import { toast } from "sonner";

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "complaints")
            // orderBy("createdAt", "desc") // Client-side sort
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side
            data.sort((a: any, b: any) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.seconds - a.createdAt.seconds;
            });

            setComplaints(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "Pending" ? "Resolved" : "Pending";
        try {
            await updateDoc(doc(db, "complaints", id), {
                status: newStatus
            });
            toast.success(`Marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="min-h-screen pb-20 animate-fade-in">
            <header className="bg-slate-900 text-white p-8 mb-8 sticky top-0 z-10 shadow-lg">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black mb-1">Admin Panel</h1>
                        <p className="text-slate-400 text-sm">Complaint Management System</p>
                    </div>
                    <div className="bg-red-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4" />
                        {complaints.filter(c => c.status === "Pending").length} Pending
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6">
                <div className="grid gap-6">
                    {complaints.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
                            {/* Image Section */}
                            {item.image && (
                                <div className="md:w-64 h-48 md:h-auto bg-slate-100 flex-shrink-0">
                                    <img src={item.image} alt="Evidence" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Content Section */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                            <User className="h-4 w-4" />
                                            <span className="font-bold text-slate-900">{item.userName}</span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{item.userDistrict}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {item.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleStatus(item.id, item.status)}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${item.status === "Resolved"
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                            }`}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        {item.status}
                                    </button>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-center gap-2 mb-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                                        <Clock className="h-3 w-3" />
                                        Duration: {item.duration}
                                    </div>
                                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
                                        {item.details}
                                    </p>

                                    {/* Reply Section */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        {item.reply ? (
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Admin Reply</p>
                                                <p className="text-sm text-slate-700 font-medium">{item.reply}</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Write a reply..."
                                                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-sm focus:ring-1 focus:ring-primary"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value;
                                                            if (!val.trim()) return;
                                                            try {
                                                                await updateDoc(doc(db, "complaints", item.id), {
                                                                    reply: val,
                                                                    status: "Resolved" // Auto-resolve on reply? Maybe optional but good UX
                                                                });
                                                                toast.success("Reply sent successfully");
                                                            } catch (err) {
                                                                toast.error("Failed to send reply");
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800">
                                                    Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminComplaints;
