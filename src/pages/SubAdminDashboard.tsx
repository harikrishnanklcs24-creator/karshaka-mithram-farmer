import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { AlertOctagon, CheckCircle, Clock, Users, Leaf, ArrowRight, PieChart as PieChartIcon, BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

const SubAdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalComplaints: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        totalDiagnoses: 0,
        highRiskDiagnoses: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

    const handleReply = async (id: string, type: string) => {
        const message = replyTexts[id];
        if (!message?.trim()) return;

        const collectionName = type === 'diagnosis' ? 'requests' : 'complaints';

        try {
            await updateDoc(doc(db, collectionName, id), {
                reply: message,
                status: "Resolved",
                resolvedAt: new Date().toISOString()
            });
            toast.success("Reply sent & marked as Resolved");
            setReplyTexts(prev => ({ ...prev, [id]: "" }));

            setRecentActivity(prev => prev.map(item =>
                item.id === id ? { ...item, status: "Resolved", reply: message } : item
            ));
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reply");
        }
    };

    const handleEscalate = async (id: string, type: string) => {
        const collectionName = type === 'diagnosis' ? 'requests' : 'complaints';
        try {
            await updateDoc(doc(db, collectionName, id), {
                status: "Escalated",
                escalatedAt: new Date().toISOString()
            });
            toast.success("Escalated to higher authority");
            setRecentActivity(prev => prev.map(item =>
                item.id === id ? { ...item, status: "Escalated" } : item
            ));
        } catch (error) {
            console.error(error);
            toast.error("Failed to escalate");
        }
    };

    const [chartData, setChartData] = useState({
        complaintStatus: [] as any[],
        diagnosisRisk: [] as any[],
        cropDistribution: [] as any[]
    });

    const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);

    // Real-time Emergency Alerts Listener
    useEffect(() => {
        const q = query(
            collection(db, "requests"),
            where("priority", "==", "critical"),
            where("status", "==", "Pending"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmergencyAlerts(alerts);

            // Play sound or show toast for new alerts
            if (alerts.length > 0) {
                // Check if it's a new alert (simple check: first item is very recent)
                const latest: any = alerts[0];
                const alertTime = new Date(latest.createdAt).getTime();
                if (Date.now() - alertTime < 60000) { // < 1 minute
                    toast.error("CRITICAL EMERGENCY REPORTED!", {
                        description: `${latest.cropCategory} in ${latest.userDistrict}`,
                        duration: 10000
                    });
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            // Complaints Stats
            const complaintsRef = collection(db, "complaints");
            const complaintsSnap = await getDocs(complaintsRef);

            // Diagnosis Stats
            const requestsRef = collection(db, "requests");
            const requestsSnap = await getDocs(requestsRef);

            // Process stats (existing logic)
            const totalComplaints = complaintsSnap.size;
            const pendingComplaints = complaintsSnap.docs.filter(doc => doc.data().status === "Pending").length;
            const resolvedComplaints = complaintsSnap.docs.filter(doc => doc.data().status === "Resolved").length;
            const totalDiagnoses = requestsSnap.size;
            const highRiskDiagnoses = requestsSnap.docs.filter(doc => {
                const data = doc.data();
                return data.diagnosis?.riskLevel === "High" || data.riskLevel === "High";
            }).length;

            setStats({
                totalComplaints,
                pendingComplaints,
                resolvedComplaints,
                totalDiagnoses,
                highRiskDiagnoses
            });

            // Prepare Chart Data
            // 1. Complaint Status
            const statusData = [
                { name: 'Pending', value: pendingComplaints, fill: '#ef4444' }, // red-500
                { name: 'Resolved', value: resolvedComplaints, fill: '#22c55e' } // green-500
            ];

            // 2. Diagnosis Risk Level
            let high = 0, medium = 0, low = 0;
            requestsSnap.docs.forEach(doc => {
                const data = doc.data();
                const risk = data.diagnosis?.riskLevel || data.riskLevel;
                if (risk === 'High') high++;
                else if (risk === 'Medium') medium++;
                else if (risk === 'Low') low++;
            });
            const riskData = [
                { name: 'High Risk', value: high, fill: '#ef4444' },
                { name: 'Medium Risk', value: medium, fill: '#eab308' },
                { name: 'Low Risk', value: low, fill: '#22c55e' }
            ];

            // 3. Crop Distribution (Top 5)
            const cropCounts: { [key: string]: number } = {};
            requestsSnap.docs.forEach(doc => {
                const crop = doc.data().cropCategory || 'Unknown';
                cropCounts[crop] = (cropCounts[crop] || 0) + 1;
            });
            const cropData = Object.entries(cropCounts)
                .map(([name, value]) => ({ name, value, fill: '#3b82f6' }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            setChartData({
                complaintStatus: statusData,
                diagnosisRisk: riskData,
                cropDistribution: cropData
            });


            // combined recent activity (existing logic)
            const recentComplaints = complaintsSnap.docs.map(doc => ({
                id: doc.id,
                type: 'complaint',
                ...doc.data()
            }));

            const recentDiagnoses = requestsSnap.docs.map(doc => ({
                id: doc.id,
                type: 'diagnosis',
                ...doc.data()
            }));

            const combinedActivity = [...recentComplaints, ...recentDiagnoses]
                .sort((a: any, b: any) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
                    return dateB - dateA;
                })
                .slice(0, 10);

            setRecentActivity(combinedActivity);
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Sub-Admin Overview</h1>
                <p className="text-slate-500">Monitor platform activity and user issues</p>
            </header>

            {/* Emergency Alerts Banner */}
            {emergencyAlerts.length > 0 && (
                <div className="bg-red-600 rounded-[2rem] p-6 text-white shadow-lg shadow-red-200 animate-pulse relative overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-full animate-shimmer" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <AlertTriangle className="h-8 w-8 text-white animate-bounce" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black">CRITICAL EMERGENCY DETECTED</h2>
                            <p className="font-medium text-red-50 text-lg">
                                {emergencyAlerts.length} Active {emergencyAlerts.length === 1 ? 'Emergency' : 'Emergencies'} Reported! Check details immediately.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                // Scroll to recent activity or specialized view
                                document.getElementById('recent-activity')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-white text-red-600 px-6 py-3 rounded-xl font-black hover:bg-red-50 transition-colors shadow-sm"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            )}

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Total Issues</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{stats.totalComplaints + stats.totalDiagnoses}</p>
                        <p className="text-sm text-slate-500 mt-1">Combined Reports</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                            <AlertOctagon className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Under Review</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{stats.pendingComplaints}</p>
                        <p className="text-sm text-slate-500 mt-1">Pending Complaints</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Resolved</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{stats.resolvedComplaints}</p>
                        <p className="text-sm text-slate-500 mt-1">Closed Tickets</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                            <Leaf className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">High Risk</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{stats.highRiskDiagnoses}</p>
                        <p className="text-sm text-slate-500 mt-1">Critical Diagnoses</p>
                    </div>
                </div>
            </div>

            {/* Recent Complaints Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">Recent Activity</h3>
                        <p className="text-sm text-slate-500">Latest complaints and AI diagnoses</p>
                    </div>
                    <button onClick={() => navigate("/admin/complaints")} className="flex items-center gap-2 text-primary font-bold hover:underline">
                        View All <ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {recentActivity.map(item => (
                        <div key={item.id} className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-4 group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.type === 'diagnosis'
                                        ? 'bg-orange-100 text-orange-600'
                                        : item.status === 'Pending' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {item.type === 'diagnosis' ? <Leaf className="h-5 w-5" /> : (item.status === 'Pending' ? <AlertOctagon className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />)}
                                    </div>
                                    <div>
                                        {item.type === 'diagnosis' ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                        {item.userName || "Farmer"}
                                                    </span>
                                                    {item.userDistrict && (
                                                        <span className="text-[10px] text-slate-400">
                                                            • {item.userDistrict}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-bold text-slate-900">AI Diagnosis: {item.cropCategory}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {item.diagnosis?.problemType}: {item.description}
                                                </p>
                                                {item.image && (
                                                    <img src={item.image} alt="Crop" className="mt-2 h-16 w-16 object-cover rounded-lg border border-slate-200" />
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-slate-900">{item.userName}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{item.details}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.type === 'diagnosis' ? (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.riskLevel === 'High' ? 'bg-red-100 text-red-600' :
                                            item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {item.riskLevel} Risk
                                        </span>
                                    ) : (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.status === 'Pending' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {item.status}
                                        </span>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {item.createdAt?.seconds
                                            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                                            : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>
                            </div>

                            {/* Reply Input */}
                            {item.status === 'Pending' && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        placeholder="Write a reply..."
                                        className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={replyTexts[item.id] || ""}
                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    />
                                    <button
                                        onClick={() => handleReply(item.id, item.type)}
                                        className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        Reply
                                    </button>
                                    <button
                                        onClick={() => handleEscalate(item.id, item.type)}
                                        className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Escalate
                                    </button>
                                </div>
                            )}
                            {item.reply && (
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-700">
                                    <span className="font-bold">You replied:</span> {item.reply}
                                </div>
                            )}
                        </div>
                    ))}

                    {recentActivity.length === 0 && (
                        <p className="text-center text-slate-500 py-10">No recent complaints found</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubAdminDashboard;
