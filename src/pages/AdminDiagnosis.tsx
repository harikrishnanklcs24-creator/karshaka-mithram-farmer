import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, Filter, ArrowUpDown, Leaf, AlertCircle, MapPin, Calendar, User } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const AdminDiagnosis = () => {
    const [diagnoses, setDiagnoses] = useState<any[]>([]);
    const [filteredDiagnoses, setFilteredDiagnoses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [sortOrder, setSortOrder] = useState<"risk" | "date">("risk");
    const [filterType, setFilterType] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null);
    const [replyText, setReplyText] = useState("");

    const handleReply = async () => {
        if (!replyText.trim() || !selectedDiagnosis) return;
        try {
            await updateDoc(doc(db, "requests", selectedDiagnosis.id), {
                reply: replyText,
                status: "Resolved",
                resolvedAt: new Date().toISOString()
            });
            toast.success("Reply sent to user");
            setReplyText("");
            setSelectedDiagnosis(null);
        } catch (error) {
            toast.error("Failed to send reply");
        }
    };

    const handleEscalate = async () => {
        if (!selectedDiagnosis) return;
        try {
            await updateDoc(doc(db, "requests", selectedDiagnosis.id), {
                status: "Escalated",
                escalatedAt: new Date().toISOString()
            });
            toast.success("Escalated to higher authority");
            setSelectedDiagnosis(null);
        } catch (error) {
            toast.error("Failed to escalate");
        }
    };

    useEffect(() => {
        const q = query(
            collection(db, "requests")
            // orderBy("createdAt", "desc")  <-- Removing this to avoid index requirement for now
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDiagnoses(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let result = [...diagnoses];

        // Filter by Type
        if (filterType !== "All") {
            result = result.filter(d => d.diagnosis?.problemType === filterType);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.diagnosis?.problemType?.toLowerCase().includes(q) ||
                d.cropCategory?.toLowerCase().includes(q) ||
                d.userDistrict?.toLowerCase().includes(q)
            );
        }

        // Sort
        if (sortOrder === "risk") {
            const riskWeight = { "High": 3, "Medium": 2, "Low": 1, "None": 0 };
            result.sort((a, b) => {
                const riskA = riskWeight[a.diagnosis?.riskLevel as keyof typeof riskWeight] || 0;
                const riskB = riskWeight[b.diagnosis?.riskLevel as keyof typeof riskWeight] || 0;
                return riskB - riskA; // High to Low
            });
        }
        // Date sort
        if (sortOrder === "date") {
            result.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
                return dateB - dateA;
            });
        }

        setFilteredDiagnoses(result);
    }, [diagnoses, filterType, sortOrder, searchQuery]);

    // Extract unique problem types for filter dropdown
    const problemTypes = ["All", ...new Set(diagnoses.map(d => d.diagnosis?.problemType).filter(Boolean))];

    return (
        <div className="min-h-screen pb-20 animate-fade-in">
            <header className="bg-slate-900 text-white p-8 mb-8 sticky top-0 z-10 shadow-lg">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black mb-1">AI Diagnosis Review</h1>
                        <p className="text-slate-400 text-sm">Monitor crop issues reported by users</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary w-48 md:w-64"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6">
                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {problemTypes.slice(0, 5).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filterType === type
                                    ? "bg-primary text-white"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Sort By:</span>
                        <button
                            onClick={() => setSortOrder("risk")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${sortOrder === "risk" ? "bg-red-100 text-red-600" : "bg-white border border-slate-200 text-slate-500"
                                }`}
                        >
                            <AlertCircle className="h-3 w-3" /> Risk Level
                        </button>
                        <button
                            onClick={() => setSortOrder("date")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${sortOrder === "date" ? "bg-blue-100 text-blue-600" : "bg-white border border-slate-200 text-slate-500"
                                }`}
                        >
                            <Calendar className="h-3 w-3" /> Recent
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDiagnoses.map(item => (
                        <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                        <Leaf className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 line-clamp-1">{item.cropCategory}</p>
                                        <span className="text-xs text-slate-500">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${item.diagnosis?.riskLevel === "High" ? "bg-red-100 text-red-600" :
                                    item.diagnosis?.riskLevel === "Medium" ? "bg-orange-100 text-orange-600" :
                                        "bg-green-100 text-green-600"
                                    }`}>
                                    {item.diagnosis?.riskLevel}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3">
                                {item.image && (
                                    <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                                        <img src={item.image} alt="Crop" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Problem</p>
                                    <p className="font-bold text-slate-800">{item.diagnosis?.problemType}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <User className="h-3 w-3" />
                                        {item.userName || "Unknown User"}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin className="h-3 w-3" />
                                        {item.userDistrict || "Unknown Loc"}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedDiagnosis(item)}
                                className="mt-6 w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors"
                            >
                                View Full Details
                            </button>
                        </div>
                    ))}
                </div>

                {filteredDiagnoses.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-bold">No diagnoses found matching your filters.</p>
                    </div>
                )}
            </main>

            {/* Detail Dialog */}
            <Dialog open={!!selectedDiagnosis} onOpenChange={() => setSelectedDiagnosis(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            Details
                            {selectedDiagnosis?.diagnosis?.riskLevel && (
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${selectedDiagnosis.diagnosis.riskLevel === "High" ? "bg-red-100 text-red-600" :
                                    selectedDiagnosis.diagnosis.riskLevel === "Medium" ? "bg-orange-100 text-orange-600" :
                                        "bg-green-100 text-green-600"
                                    }`}>
                                    {selectedDiagnosis.diagnosis.riskLevel} Risk
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Reported on {selectedDiagnosis?.createdAt?.seconds ? new Date(selectedDiagnosis.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown Date'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDiagnosis && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Crop</p>
                                    <p className="font-bold text-slate-900">{selectedDiagnosis.cropCategory}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Problem</p>
                                    <p className="font-bold text-slate-900">{selectedDiagnosis.diagnosis?.problemType}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">Description</h3>
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                    {selectedDiagnosis.diagnosis?.description}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">Recommended Action</h3>
                                <p className="text-slate-600 leading-relaxed bg-green-50 p-4 rounded-2xl border border-green-100">
                                    {selectedDiagnosis.diagnosis?.solution}
                                </p>
                            </div>

                            {selectedDiagnosis.image && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2">Uploaded Image</h3>
                                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                                        <img src={selectedDiagnosis.image} alt="Crop Issue" className="w-full object-cover" />
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2">Sub-Admin Action</h3>
                                <textarea
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Write a reply to the farmer..."
                                    rows={3}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReply}
                                        className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        Send Reply & Resolve
                                    </button>
                                    <button
                                        onClick={handleEscalate}
                                        className="flex-1 bg-red-50 text-red-600 border border-red-100 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Pass to Higher Authority
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDiagnosis;
