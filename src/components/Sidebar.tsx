import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
    LayoutDashboard, Leaf, ShoppingBag, History,
    User, LogOut, Menu, X, Bell, Search,
    ChevronRight, Settings, MessageSquare, Sprout, Users, AlertOctagon, CloudRain
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const userMenuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Leaf, label: "Diagnosis", path: "/diagnosis" },
        { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
        { icon: Users, label: "Community", path: "/community" },
        { icon: AlertOctagon, label: "Complaints", path: "/complaints" },
        { icon: History, label: "History", path: "/history" },
        { icon: Sprout, label: "Natural Pesticides", path: "/pesticides" },
        { icon: MessageSquare, label: "Feedback", path: "/feedback" },
        { icon: User, label: "My Profile", path: "/profile" },
    ];

    const adminMenuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/admin/dashboard" },
        { icon: AlertOctagon, label: "Complaints", path: "/admin/complaints" },
        { icon: Leaf, label: "AI Diagnosis", path: "/admin/diagnosis" },
        { icon: CloudRain, label: "Weather Prediction", path: "/admin/weather" },
    ];

    const menuItems = isAdmin ? adminMenuItems : userMenuItems;

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const NavItem = ({ item, mobile = false }: { item: typeof menuItems[0], mobile?: boolean }) => {
        const isActive = location.pathname === item.path;
        return (
            <button
                onClick={() => {
                    navigate(item.path);
                    if (mobile) setIsOpen(false);
                }}
                className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-95",
                    isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1"
                        : "text-slate-500 hover:text-primary hover:translate-x-1"
                )}
            >
                <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "animate-pulse" : "group-hover:scale-110 group-hover:rotate-3")} />
                <span className="font-bold text-sm">{item.label}</span>
                {isActive && (
                    <div className="absolute right-2 h-2 w-2 rounded-full bg-white animate-scale-in shadow-sm" />
                )}
                <div className={cn(
                    "absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10",
                    isActive && "hidden"
                )} />
            </button>
        );
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
                    <span className="font-black text-slate-900 tracking-tight">KARSHAKA</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl">
                        <Bell className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-1">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 leading-tight">KARSHAKA</h2>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Digital Farmer</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {menuItems.map((item, index) => (
                            <div key={item.path} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <NavItem item={item} />
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 space-y-4">
                    <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{userData?.name || "Farmer"}</p>
                                <p className="text-[10px] text-slate-500 truncate">{userData?.district || "Kerala"}</p>
                            </div>
                            <button onClick={() => navigate("/profile")} className="p-1 hover:bg-white rounded-lg transition-colors">
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all group"
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Drawer Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white z-[70] lg:hidden transform transition-transform duration-500 ease-out p-6 flex flex-col shadow-2xl overflow-y-auto",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-xl" />
                        <span className="font-black text-xl text-slate-900">Karshaka</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 bg-slate-50 rounded-xl text-slate-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {menuItems.map((item) => (
                        <NavItem key={item.path} item={item} mobile />
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
