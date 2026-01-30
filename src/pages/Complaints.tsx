import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Camera, Upload, AlertCircle, CheckCircle, Loader2, Save, AlertOctagon, Clock, Phone } from "lucide-react";
import { toast } from "sonner";

const Complaints = () => {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [myComplaints, setMyComplaints] = useState<any[]>([]);

    // Form State
    const [details, setDetails] = useState("");
    const [phone, setPhone] = useState(userData?.phone || "");
    const [duration, setDuration] = useState("");
    const [image, setImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch User's Complaints
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "complaints"),
            where("userId", "==", user.uid)
            // orderBy("createdAt", "desc") // Client-side sort to avoid index
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort
            data.sort((a: any, b: any) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.seconds - a.createdAt.seconds;
            });
            setMyComplaints(data);
        });

        return () => unsubscribe();
    }, [user]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !details || !duration) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "complaints"), {
                userId: user.uid,
                userName: userData?.name || "Farmer",
                userDistrict: userData?.district || "Unknown",
                phone,
                details,
                duration,
                image, // Storing base64 for demo simplicity
                status: "Pending",
                createdAt: serverTimestamp()
            });

            toast.success("Complaint registered successfully!");
            // Reset form
            setDetails("");
            setDuration("");
            setImage(null);
        } catch (error) {
            console.error("Complaint Error:", error);
            toast.error("Failed to register complaint");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 animate-fade-in">
            <header className="bg-red-50 p-8 rounded-b-[3rem] mb-8">
                <div className="max-w-xl mx-auto text-center">
                    <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <AlertOctagon className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Register Complaint</h1>
                    <p className="text-slate-500">
                        Report agricultural issues directly to the administration. We are here to help.
                    </p>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 space-y-8">
                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Contact Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="farmer-input pl-12"
                                placeholder="Your phone number"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Issue Duration</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                required
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="farmer-input pl-12"
                                placeholder="e.g., 2 weeks, 3 days"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Complaint Details</label>
                        <textarea
                            required
                            rows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="farmer-input resize-none p-4"
                            placeholder="Describe your issue in detail..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Evidence Photo (Optional)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            {image ? (
                                <div className="relative w-full h-48">
                                    <img src={image} alt="Evidence" className="w-full h-full object-contain rounded-lg" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                        <p className="text-white font-bold text-sm">Change Photo</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Camera className="h-8 w-8 text-slate-400" />
                                    <p className="text-sm text-slate-500 font-medium">Click to upload photo</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="farmer-btn w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 shadow-red-200"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Submit Complaint</>}
                    </button>
                </form>

                {/* History Section */}
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-4 ml-2">My Complaints</h3>
                    {myComplaints.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p>No complaints registered yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myComplaints.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${item.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.details}</p>
                                        <p className="text-xs text-slate-500 mt-1 mb-2">Duration: {item.duration}</p>

                                        {item.reply && (
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2">
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Reply from Admin</p>
                                                <p className="text-xs text-slate-700 font-medium">{item.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Complaints;
