import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Users, AlertTriangle, ShieldCheck, Activity, UserCog, LogOut, LayoutDashboard, FileText, Stethoscope, BarChart3, TrendingUp, PieChart, Search, Filter, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
    RadialBarChart, RadialBar, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell,
    LineChart, Line, CartesianGrid, ComposedChart, Area, PieChart as RechartsPieChart, Pie
} from "recharts";

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'complaints' | 'diagnoses' | 'notifications'>('dashboard');

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [subAdmins, setSubAdmins] = useState<any[]>([]);
    const [allComplaints, setAllComplaints] = useState<any[]>([]);
    const [allRequests, setAllRequests] = useState<any[]>([]);
    const [escalatedComplaints, setEscalatedComplaints] = useState<any[]>([]);
    const [escalatedDiagnoses, setEscalatedDiagnoses] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Offer/Notification Form States
    const [offerDescription, setOfferDescription] = useState("");
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

    // Chart Data
    const [pieData, setPieData] = useState<any[]>([]);
    const [lineData, setLineData] = useState<any[]>([]);
    const [comboData, setComboData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Users & SubAdmins
                const usersSnap = await getDocs(collection(db, "users"));
                const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(allUsers);
                setSubAdmins(allUsers.filter((u: any) => u.role === 'subadmin' || u.email?.includes('subadmin')));

                // 2. Fetch Complaints
                const complaintsSnap = await getDocs(collection(db, "complaints"));
                const cList = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllComplaints(cList);
                setEscalatedComplaints(cList.filter((c: any) => c.status === 'Escalated'));

                // 3. Fetch Requests (Diagnoses)
                const requestsSnap = await getDocs(collection(db, "requests"));
                const rList = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllRequests(rList);
                setEscalatedDiagnoses(rList.filter((r: any) => r.status === 'Escalated'));

                // 4. Fetch Notifications (stored in 'offers' collection)
                const offersSnap = await getDocs(collection(db, "offers"));
                setOffers(offersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // --- PREPARE CHARTS ---

                // Pie Chart: Status Distribution
                let resolved = 0, pending = 0, escalated = 0;
                [...cList, ...rList].forEach((item: any) => {
                    const s = item.status || 'Pending';
                    if (['Resolved', 'Completed'].includes(s)) resolved++;
                    else if (s === 'Escalated') escalated++;
                    else pending++;
                });
                setPieData([
                    { name: 'Resolved', value: resolved, fill: '#4ade80' },
                    { name: 'Pending', value: pending, fill: '#facc15' },
                    { name: 'Escalated', value: escalated, fill: '#f87171' }
                ]);

                // Line Chart: Trend (Mocked)
                setLineData([
                    { name: 'Week 1', users: Math.floor(allUsers.length * 0.2), issues: 5 },
                    { name: 'Week 2', users: Math.floor(allUsers.length * 0.5), issues: 12 },
                    { name: 'Week 3', users: Math.floor(allUsers.length * 0.8), issues: 25 },
                    { name: 'Week 4', users: allUsers.length, issues: cList.length + rList.length },
                ]);

                // Combo Chart: Issues by District
                const distMap: any = {};
                [...cList, ...rList].forEach((item: any) => {
                    const d = item.district || item.userDistrict || 'Unknown';
                    if (!distMap[d]) distMap[d] = { comp: 0, diag: 0 };
                    item.complaint ? distMap[d].comp++ : distMap[d].diag++;
                });
                setComboData(Object.entries(distMap).map(([k, v]: any) => ({
                    name: k, complaints: v.comp, diagnoses: v.diag, total: v.comp + v.diag
                })));

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const handleCreateOffer = async () => {
        if (!offerDescription.trim()) return;
        setIsSubmittingOffer(true);
        try {
            await addDoc(collection(db, "offers"), {
                description: offerDescription,
                imageUrl: null, // No image for text notifications
                createdAt: new Date().toISOString(),
                active: true
            });
            // Refresh offers locally
            const offersSnap = await getDocs(collection(db, "offers"));
            setOffers(offersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Reset form
            setOfferDescription("");
            alert("Notification posted successfully!");
        } catch (error) {
            console.error("Error creating notification:", error);
            alert("Failed to post notification.");
        } finally {
            setIsSubmittingOffer(false);
        }
    };

    const handleDeleteOffer = async (id: string) => {
        if (!confirm("Are you sure you want to delete this notification?")) return;
        try {
            await deleteDoc(doc(db, "offers", id));
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete.");
        }
    };

    const SidebarItem = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-bold text-sm text-left">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:flex flex-col p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl" />
                    <div>
                        <h2 className="font-black text-slate-900 leading-tight">Karshaka<br />Mitra</h2>
                    </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</div>
                    <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <SidebarItem id="users" label="Users & Sub-Admins" icon={Users} />
                    <SidebarItem id="notifications" label="Notifications" icon={Bell} />
                    <SidebarItem id="analytics" label="Analytics" icon={BarChart3} />

                    <div className="mt-6 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issues</div>
                    <SidebarItem id="complaints" label="Unresolved Complaints" icon={AlertTriangle} />
                    <SidebarItem id="diagnoses" label="Escalated Diagnoses" icon={Stethoscope} />
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-8 animate-fade-in overflow-y-auto h-screen">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 capitalize">
                        {activeTab === 'notifications' ? 'Manage Notifications' : activeTab.replace('-', ' ')}
                    </h1>
                    <p className="text-slate-500 text-sm">Super Admin Overview</p>
                </header>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
                ) : (
                    <div className="space-y-8">
                        {/* 1. Dashboard View (Charts) */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-8">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                        <p className="text-slate-400 text-xs font-bold uppercase">Total Users</p>
                                        <p className="text-4xl font-black text-slate-900 mt-2">{users.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                        <p className="text-slate-400 text-xs font-bold uppercase">Total Issues</p>
                                        <p className="text-4xl font-black text-slate-900 mt-2">{allComplaints.length + allRequests.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                        <p className="text-slate-400 text-xs font-bold uppercase">Escalated</p>
                                        <p className="text-4xl font-black text-red-500 mt-2">{escalatedComplaints.length + escalatedDiagnoses.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                        <p className="text-slate-400 text-xs font-bold uppercase">Resolved</p>
                                        <p className="text-4xl font-black text-green-500 mt-2">{pieData.find(d => d.name === 'Resolved')?.value || 0}</p>
                                    </div>
                                </div>

                                {/* Main Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Pie Chart */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><PieChart className="h-5 w-5 text-purple-500" /> Issue Status</h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                    <Legend />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Line Chart */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /> Engagement Trend</h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={lineData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <RechartsTooltip />
                                                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={3} />
                                                    <Line type="monotone" dataKey="issues" stroke="#f43f5e" strokeWidth={3} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Combo Chart */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> District Analysis</h3>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={comboData}>
                                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <RechartsTooltip />
                                                <Legend />
                                                <Bar dataKey="complaints" barSize={20} fill="#413ea0" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="diagnoses" barSize={20} fill="#ff7300" radius={[4, 4, 0, 0]} />
                                                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Users & Sub-Admins */}
                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-lg mb-4">Active Sub-Admins</h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {subAdmins.map((admin: any, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                    {(admin.name?.[0] || 'A').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{admin.name || 'Admin'}</p>
                                                    <p className="text-xs text-slate-500">{admin.email}</p>
                                                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                                                        {admin.district || 'Global'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-lg mb-4">All Users ({users.length})</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-l-xl">User</th>
                                                    <th className="px-4 py-3">Email</th>
                                                    <th className="px-4 py-3 rounded-r-xl">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.slice(0, 10).map((u: any, i) => (
                                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-medium text-slate-900">{u.name || 'User'}</td>
                                                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold">{u.role || 'User'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p className="text-center text-xs text-slate-400 mt-4">Showing first 10 users</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Analytics (Table View for Detail) */}
                        {activeTab === 'analytics' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center py-20">
                                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-purple-200" />
                                <h3 className="text-xl font-bold text-slate-900">Detailed Analytics Reports</h3>
                                <p className="text-slate-500 mt-2">Exportable reports and deep-dive filtering coming soon.</p>
                            </div>
                        )}

                        {/* 4. Notifications (Manage) */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-8">
                                {/* Create Notification Form */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm">
                                    <h3 className="font-bold text-xl text-blue-900 mb-6 flex items-center gap-2">
                                        <Bell className="h-6 w-6 text-blue-600" /> Broadcast Notification
                                    </h3>
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-slate-700">Notification Message (Shown to all users)</label>
                                        <textarea
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-600 h-32 resize-none"
                                            placeholder="Enter important announcement here..."
                                            value={offerDescription}
                                            onChange={(e) => setOfferDescription(e.target.value)}
                                        ></textarea>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={handleCreateOffer}
                                                disabled={isSubmittingOffer || !offerDescription.trim()}
                                                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                                            >
                                                {isSubmittingOffer ? 'Sending...' : 'Send Notification'}
                                            </button>
                                            <p className="text-xs text-slate-500">* Messages appear on user dashboards immediately.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Notifications List */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-slate-900">Active Notifications</h3>
                                    {offers.map((offer, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                                <Bell className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-lg">{offer.description}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Posted: {new Date(offer.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOffer(offer.id)}
                                                className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                    {offers.length === 0 && <p className="text-slate-500 text-sm italic">No active notifications.</p>}
                                </div>
                            </div>
                        )}

                        {/* 5. Unresolved Complaints */}
                        {activeTab === 'complaints' && (
                            <div className="space-y-4">
                                {escalatedComplaints.length === 0 ? (
                                    <div className="text-center py-20 opacity-50">
                                        <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium text-slate-500">No unresolved complaints escalated to you.</p>
                                    </div>
                                ) : (
                                    escalatedComplaints.map((item: any, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                                                    <AlertTriangle className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-lg text-slate-900">{item.subject || 'Complaint'}</h3>
                                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Escalated</span>
                                                    </div>
                                                    <p className="text-slate-600 mt-2 mb-4 leading-relaxed">{item.complaint || item.description}</p>

                                                    <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 text-sm">
                                                        <div className="flex-1">
                                                            <p className="text-xs text-slate-400 uppercase font-bold">User Details</p>
                                                            <p className="font-bold text-slate-900">{item.userName || 'Unknown User'}</p>
                                                            <p className="text-slate-500">{item.userEmail} • {item.district}</p>
                                                        </div>
                                                        <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                                                            Mark Resolved
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 6. Escalated Diagnoses */}
                        {activeTab === 'diagnoses' && (
                            <div className="space-y-6">
                                {escalatedDiagnoses.length === 0 ? (
                                    <div className="text-center py-20 opacity-50">
                                        <Stethoscope className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium text-slate-500">No diagnoses escalated to you.</p>
                                    </div>
                                ) : (
                                    escalatedDiagnoses.map((item: any, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-orange-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                {/* Image Section */}
                                                <div className="h-64 md:h-full bg-slate-100 rounded-2xl overflow-hidden relative group">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt="Crop" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <FileText className="h-12 w-12" />
                                                            <span className="ml-2 font-bold">No Image</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                                                        {item.diagnosis?.confidence ? `${(item.diagnosis.confidence * 100).toFixed(0)}% Match` : 'AI Analysis'}
                                                    </div>
                                                </div>

                                                {/* Details Section */}
                                                <div className="md:col-span-2 flex flex-col">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> Escalated Diagnosis
                                                        </span>
                                                        <span className="text-slate-400 text-xs">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                    </div>

                                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                                        {item.diagnosis?.problemType || 'Unknown Issue'}
                                                    </h3>
                                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                                        {item.details || item.description || "No specific details provided by user."}
                                                    </p>

                                                    <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 mb-6">
                                                        <p className="text-xs text-orange-400 font-bold uppercase mb-2">Sub-Admin Escalation Note</p>
                                                        <p className="text-slate-700 font-medium italic">
                                                            "{item.adminNote || 'Escalated for expert review.'}"
                                                        </p>
                                                    </div>

                                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                                {(item.userName?.[0] || 'U').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{item.userName || 'Farmer'}</p>
                                                                <p className="text-xs text-slate-500">{item.userDistrict || 'Unknown District'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <button className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                                                Contact
                                                            </button>
                                                            <button className="bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                                                                Send Diagnosis
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
