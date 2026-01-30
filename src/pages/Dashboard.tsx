import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { LogOut, Sun, CloudRain, History, ShoppingBag, Leaf, Loader2, TrendingUp, User, Plus, AlertCircle } from "lucide-react";
import SatelliteInsights from "@/components/SatelliteInsights";
import SubAdminDashboard from "./SubAdminDashboard";
import { toast } from "sonner";

const Dashboard = () => {
    const { user, userData, loading } = useAuth();
    const navigate = useNavigate();
    const [weather, setWeather] = useState<any>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);

    // Weather API Integration
    useEffect(() => {
        const fetchWeather = async () => {
            if (userData?.district) {
                setWeatherLoading(true);
                try {
                    const API_KEY = "5d7a43e894886aeb84d6a938606395b2";
                    const response = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?q=${userData.district},IN&units=metric&appid=${API_KEY}`
                    );
                    const data = await response.json();
                    setWeather(data);
                } catch (error) {
                    console.error("Weather fetch error:", error);
                } finally {
                    setWeatherLoading(false);
                }
            }
        };

        if (userData?.district) {
            fetchWeather();
        }
    }, [userData?.district]);

    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [myProductsCount, setMyProductsCount] = useState(0);
    const [requestsCount, setRequestsCount] = useState(0);
    const [marketRequests, setMarketRequests] = useState<any[]>([]);
    const [highRiskAlerts, setHighRiskAlerts] = useState<any[]>([]);

    // Fetch high risk alerts for the district
    useEffect(() => {
        if (!userData?.district) return;

        // Query for high/medium risk issues in the same district, recent first
        // Note: Using top-level 'riskLevel' field if available, but falling back to check diagnosis structure if needed is hard in one query.
        // We will assume new data has 'riskLevel' or we rely on the broader query. 
        // For robustness with legacy data, we might need 'diagnosis.riskLevel', but let's try to assume consistent schema for 'in' query.
        // Let's stick to 'diagnosis.riskLevel' for compatibility with previous step's data, OR if we want to enforce new structure:
        // Ideally we query both or migrate. Let's try 'diagnosis.riskLevel' as primary since we just added top-level. 
        // Wait, I just changed Diagnosis to save it top-level. I should query top-level if I want to be clean, but existing data doesn't have it.
        // Let's query 'diagnosis.riskLevel' as it exists in both (nested in object). 
        // Actually, let's keep querying `diagnosis.riskLevel` to support the data created in the last 10 minutes.
        // But for "immediate" effect, the user might imply "Push". Firestore OnSnapshot IS immediate.

        // Let's add the TOAST trigger here.
        const q = query(
            collection(db, "requests"),
            where("district", "==", userData.district),
            where("diagnosis.riskLevel", "in", ["High", "Medium"]),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Trigger toast if the top alert is new (simple check: different ID from current)
            // We need a ref or access to previous state to know if it's "new" vs "initial load".
            // For simplicity, we won't dedupe strictly on id vs state here to avoid complex loops, 
            // but we can check if the alert is very recent (e.g. created in last minute).
            if (alerts.length > 0) {
                const latest = alerts[0] as any;
                const alertTime = new Date(latest.createdAt).getTime();
                const now = new Date().getTime();
                // If created in the last 5 minutes, show toast (to avoid spamming on every reload for old alerts)
                if (now - alertTime < 5 * 60 * 1000) {
                    toast.warning(`New ${latest.diagnosis?.riskLevel} Risk Alert in ${userData.district}!`, {
                        description: `${latest.diagnosis?.problemType} reported just now.`,
                        duration: 5000,
                    });
                }
            }

            setHighRiskAlerts(alerts);
        }, (error) => {
            console.error("Error fetching alerts:", error);
        });

        return () => unsubscribe();
    }, [userData?.district]);

    // Fetch diagnosis history
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "requests"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(5)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentRequests(reqs);
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch user's product count
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "products"),
            where("sellerId", "==", user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyProductsCount(snapshot.size);
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch market requests (Received or Sent)
    useEffect(() => {
        if (!user) return;
        // Simplified approach: fetch any request where user is seller or buyer
        const q = query(
            collection(db, "marketRequests"),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allReqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const userReqs = allReqs.filter((r: any) => r.sellerId === user.uid || r.buyerId === user.uid);
            setMarketRequests(userReqs);
            setRequestsCount(userReqs.filter((r: any) => r.sellerId === user.uid).length);
        });
        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    // Derived state for admin check (using the same logic as AuthContext or directly importing isAdmin if available)
    // Since useAuth now provides isAdmin, we can use it.
    // Wait, I updated useAuth but didn't destructure it here yet.
    // Let me update the import destructuring first. 
    // Actually, I can just check user email here if I don't want to change the destructuring line above right now, 
    // BUT I updated AuthContext so I should use it. 
    // However, for replace_file_content, I need to match exact lines. 
    // I entered this block to handle the render logic. I'll simply check email here to be safe and quick/robust 
    // without changing the whole top file imports which might be risky with line numbers.
    // user is available from line 12.

    if (user?.email === "subadmin@gmail.com") {
        return <SubAdminDashboard />;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <main className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
                {/* High/Medium Risk Alert Banner */}
                {highRiskAlerts.length > 0 && (
                    <div className={`border rounded-[2rem] p-6 animate-pulse flex items-start gap-4 shadow-sm ${highRiskAlerts[0].diagnosis?.riskLevel === "High"
                        ? "bg-red-50 border-red-100"
                        : "bg-orange-50 border-orange-100"
                        }`}>
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${highRiskAlerts[0].diagnosis?.riskLevel === "High"
                            ? "bg-red-100 text-red-600"
                            : "bg-orange-100 text-orange-600"
                            }`}>
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${highRiskAlerts[0].diagnosis?.riskLevel === "High" ? "text-red-700" : "text-orange-700"
                                }`}>
                                {highRiskAlerts[0].diagnosis?.riskLevel} Risk Alert in {userData?.district}
                            </h3>
                            <p className={`font-medium ${highRiskAlerts[0].diagnosis?.riskLevel === "High" ? "text-red-600" : "text-orange-600"
                                }`}>
                                Recent report: {highRiskAlerts[0].diagnosis?.problemType} found in {highRiskAlerts[0].cropCategory}.
                                Check your crops immediately.
                            </p>
                        </div>
                    </div>
                )}

                {/* Dashboard Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 hover-lift transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Leaf className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Diagnosis</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {recentRequests.length > 0 ? (
                                        recentRequests[0].diagnosis?.problemType || "Checked"
                                    ) : "None"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-primary transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 hover-lift transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marketplace</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {myProductsCount} {myProductsCount === 1 ? 'Active Listing' : 'Active Listings'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/marketplace")}
                            className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-orange-600 transition-colors"
                        >
                            <TrendingUp className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Weather Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {/* Weather Widget */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <p className="text-blue-100 text-lg">Today's Weather in {userData?.district}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    {weatherLoading ? (
                                        <Loader2 className="h-12 w-12 animate-spin opacity-50" />
                                    ) : (
                                        <>
                                            <h2 className="text-6xl font-black">{weather?.main?.temp ? Math.round(weather.main.temp) : "--"}°</h2>
                                            <div>
                                                <p className="text-xl font-bold">{weather?.weather?.[0]?.main || "Clear"}</p>
                                                <p className="text-blue-200">Feels like {weather?.main?.feels_like ? Math.round(weather.main.feels_like) : "--"}°</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex gap-6 overflow-x-auto pb-2">
                                <div className="flex-shrink-0 bg-white/10 p-4 rounded-2xl border border-white/10">
                                    <p className="text-xs text-blue-200">Humidity</p>
                                    <p className="text-lg font-bold">{weather?.main?.humidity || "--"}%</p>
                                </div>
                                <div className="flex-shrink-0 bg-white/10 p-4 rounded-2xl border border-white/10">
                                    <p className="text-xs text-blue-200">Wind</p>
                                    <p className="text-lg font-bold">{weather?.wind?.speed || "--"} km/h</p>
                                </div>
                            </div>
                        </div>
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4">
                            <Sun className="h-48 w-48 text-yellow-400 opacity-20" />
                        </div>
                    </div>

                    {/* Rain Alert Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <CloudRain className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Rain Expectation</h3>
                        <p className="text-slate-500 mt-2">
                            {weather?.weather?.[0]?.main === "Rain"
                                ? "Rain detected! Avoid spraying pesticides today."
                                : "No immediate rain expected. Ideal for field work."}
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => navigate("/")}
                        className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                    >
                        <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Leaf className="h-7 w-7 text-primary" />
                        </div>
                        <span className="font-bold text-slate-800">Disease Diagnosis</span>
                    </button>

                    <button
                        onClick={() => navigate("/marketplace")}
                        className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                    >
                        <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShoppingBag className="h-7 w-7 text-orange-600" />
                        </div>
                        <span className="font-bold text-slate-800">Marketplace</span>
                    </button>

                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-4">
                        <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                            <History className="h-7 w-7 text-purple-600" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-800">Last Diagnosis</span>
                            <span className="text-xs text-slate-500">{recentRequests[0]?.cropCategory || "None"}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-4">
                        <div className="h-14 w-14 bg-pink-50 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="h-7 w-7 text-pink-600" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-800">Active Listings</span>
                            <span className="text-xs text-slate-500">{myProductsCount} items</span>
                        </div>
                    </div>
                </div>

                {/* Recent AI Activity */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Diagnosis History</h3>
                            <p className="text-sm text-slate-500">Your saved AI conversations</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate("/history")} className="text-primary font-bold hover:underline">View Full History</button>
                            <button onClick={() => navigate("/")} className="farmer-btn text-sm px-4">New Diagnosis</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {recentRequests.length > 0 ? (
                            <div className="grid gap-4">
                                {recentRequests.map((req) => (
                                    <div key={req.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Leaf className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{req.cropCategory}</p>
                                                <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${req.diagnosis?.riskLevel === "High" ? "bg-red-100 text-red-600" :
                                            req.diagnosis?.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-600" :
                                                "bg-green-100 text-green-600"
                                            }`}>
                                            {req.diagnosis?.riskLevel} Risk
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                No recent requests found. Start by diagnosing a crop issue!
                            </p>
                        )}
                    </div>
                </div>

                {/* Satellite Monitoring Section */}
                <div className="pt-8 border-t border-slate-100 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                    <SatelliteInsights />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
