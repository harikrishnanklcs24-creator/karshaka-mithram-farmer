import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { Leaf, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Auto-assign roles based on email
            if (email === "admin@gmail.com" || email === "admin1@gmail.com") {
                await setDoc(doc(db, "users", user.uid), {
                    role: "superadmin",
                    email: email,
                    name: "Super Admin"
                }, { merge: true });
                // Force reload to ensure AuthContext picks up the new role
                window.location.href = "/super-admin";
            } else if (email === "subadmin@gmail.com") {
                await setDoc(doc(db, "users", user.uid), {
                    role: "subadmin",
                    email: email,
                    name: "Default Sub-Admin",
                    district: "Thrissur"
                }, { merge: true });
                navigate("/admin/dashboard");
            } else {
                navigate("/dashboard");
            }
            toast.success("Welcome back!");
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error(error.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center animated-background px-4 py-12 relative overflow-hidden">
            {/* Decorative floating blobs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-green-300/20 rounded-full blur-3xl animate-pulse delay-700"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="max-w-md w-full space-y-8 glass-card p-8 rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0 overflow-hidden border-2 border-primary/10 p-1">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Continue supporting Kerala's farming community
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                required
                                className="farmer-input pl-10 h-12"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                required
                                className="farmer-input pl-10 h-12"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <div className="text-sm">
                            <a href="#" className="font-semibold text-primary hover:underline underline-offset-4">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="farmer-btn w-full h-12 flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
