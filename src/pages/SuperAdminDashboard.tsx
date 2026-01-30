import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Users, AlertTriangle, ShieldCheck, Activity, UserCog, LogOut, LayoutDashboard, FileText, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'complaints' | 'diagnoses'>('users');

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [subAdmins, setSubAdmins] = useState<any[]>([]);
    const [escalatedComplaints, setEscalatedComplaints] = useState<any[]>([]);
    const [escalatedDiagnoses, setEscalatedDiagnoses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Users & SubAdmins
                const usersSnap = await getDocs(collection(db, "users"));
                const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(allUsers);
                setSubAdmins(allUsers.filter((u: any) => u.role === 'subadmin' || u.email?.includes('subadmin')));

                // 2. Fetch Complaints (Escalated)
                const complaintsSnap = await getDocs(collection(db, "complaints"));
                const eComplaints = complaintsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((c: any) => c.status === 'Escalated');
                setEscalatedComplaints(eComplaints);

                // 3. Fetch Diagnoses (Escalated)
                const requestsSnap = await getDocs(collection(db, "requests"));
                const eDiagnoses = requestsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((r: any) => r.status === 'Escalated');
                setEscalatedDiagnoses(eDiagnoses);

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

    const SidebarItem = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-bold text-sm">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Custom Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 fixed h-full z-20 hidden lg:flex flex-col p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl" />
                    <div>
                        <h2 className="font-black text-slate-900 leading-tight">Karshaka<br />Mitra</h2>
                    </div>
                </div>

                <div className="space-y-2 flex-1">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</div>
                    <SidebarItem id="users" label="Users & Sub-Admins" icon={Users} />
                    <SidebarItem id="complaints" label="Unresolved Complaints" icon={FileText} />
                    <SidebarItem id="diagnoses" label="Escalated Diagnoses" icon={Stethoscope} />
                </div>

                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-8 animate-fade-in">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">
                            {activeTab === 'users' && 'Users & Sub-Admins'}
                            {activeTab === 'complaints' && 'Unresolved Complaints'}
                            {activeTab === 'diagnoses' && 'Escalated Diagnoses'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Super Admin Control Panel</p>
                    </div>
                </header>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        {/* Users View */}
                        {activeTab === 'users' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                        <div className="text-4xl font-black text-purple-600 mb-2">{users.length}</div>
                                        <div className="text-sm font-bold text-slate-600">Total Registered Users</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                        <div className="text-4xl font-black text-blue-600 mb-2">{subAdmins.length}</div>
                                        <div className="text-sm font-bold text-slate-600">Active Sub-Admins</div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl text-slate-900">Sub-Admin Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {subAdmins.map((admin, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                                            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                {(admin.name?.[0] || 'A').toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{admin.name || 'Admin User'}</h4>
                                                <p className="text-sm text-slate-500">{admin.email}</p>
                                                <span className="inline-block mt-2 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                                                    District: {admin.district || 'All'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Complaints View */}
                        {activeTab === 'complaints' && (
                            <div className="space-y-4">
                                {escalatedComplaints.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium text-slate-500">No unresolved complaints pending.</p>
                                    </div>
                                )}
                                {escalatedComplaints.map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Unresolved</span>
                                                <span className="text-slate-400 text-xs">•</span>
                                                <span className="text-slate-500 text-xs">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 mb-2">{item.subject || 'Complaint Report'}</h3>
                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{item.complaint || item.description}</p>
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {(item.userName?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-bold text-slate-900">{item.userName}</p>
                                                    <p className="text-slate-500">{item.district}</p>
                                                </div>
                                            </div>
                                            <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Diagnoses View */}
                        {activeTab === 'diagnoses' && (
                            <div className="space-y-4">
                                {escalatedDiagnoses.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <Stethoscope className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium text-slate-500">No diagnoses passed to authority.</p>
                                    </div>
                                )}
                                {escalatedDiagnoses.map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start gap-6">
                                            <div className="h-24 w-24 bg-slate-100 rounded-2xl shrink-0 overflow-hidden">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="Crop" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <FileText className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">Escalated Diagnosis</span>
                                                    <span className="text-slate-400 text-xs">•</span>
                                                    <span className="text-slate-500 text-xs">{item.diagnosis?.problemType}</span>
                                                </div>
                                                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{item.details}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-500">From: {item.userDistrict}</span>
                                                    <button className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                                                        Take Action
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
