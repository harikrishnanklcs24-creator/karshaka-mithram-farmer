import { useState } from "react";
import { Siren, X, AlertTriangle, Bug } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EmergencyButton = () => {
    const { user, userData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEmergency = async (type: string) => {
        if (!user || !userData) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "requests"), {
                userId: user.uid,
                userName: userData.name || "Farmer",
                userDistrict: userData.district || "Unknown",
                cropCategory: type, // "Pest Invasion" or "Sudden Outbreak"
                diagnosis: {
                    problemType: type,
                    riskLevel: "High",
                    description: "EMERGENCY REPORT: Farmer reported a critical situation via Panic Button."
                },
                priority: "critical", // Special flag
                type: "emergency",
                status: "Pending",
                createdAt: new Date().toISOString()
            });
            toast.success("Emergency Alert Sent!", {
                description: "Authorities have been notified immediately."
            });
            setIsOpen(false);
        } catch (error) {
            toast.error("Failed to send alert. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Panic Button FAB */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg hover:shadow-red-500/50 transition-all animate-pulse hover:animate-none scale-100 active:scale-95 group"
            >
                <Siren className="h-8 w-8 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-red-600 animate-pulse"></div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                        >
                            <X className="h-5 w-5 text-slate-500" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Siren className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Emergency Alert</h2>
                            <p className="text-slate-500 mt-2">Describe the critical situation</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleEmergency("Pest Invasion")}
                                disabled={loading}
                                className="w-full bg-orange-50 hover:bg-orange-100 border-2 border-orange-100 p-4 rounded-2xl flex items-center gap-4 group transition-all"
                            >
                                <div className="h-12 w-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                    <Bug className="h-6 w-6 text-orange-700" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">Massive Pest Invasion</span>
                                    <span className="text-xs text-slate-500">Locusts, Beetles, etc.</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleEmergency("Sudden Outbreak")}
                                disabled={loading}
                                className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-4 group transition-all"
                            >
                                <div className="h-12 w-12 bg-red-200 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-700" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">Disease Outbreak</span>
                                    <span className="text-xs text-slate-500">Rapidly spreading issue</span>
                                </div>
                            </button>
                        </div>

                        {loading && <p className="text-center text-xs font-bold text-slate-400 mt-4">Sending Critical Alert...</p>}
                    </div>
                </div>
            )}
        </>
    );
};

export default EmergencyButton;
