import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Leaf, User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Initialize basic user profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                isOnboarded: false
            });

            toast.success("Account created successfully!");
            navigate("/onboarding");
        } catch (error: any) {
            console.error("Signup error:", error);
            toast.error(error.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center animated-background px-4 py-12 relative overflow-hidden">
            {/* Decorative floating blobs */}
            <div className="absolute top-10 right-10 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-md w-full space-y-8 glass-card p-8 rounded-[2.5rem] animate-in fade-in zoom-in duration-700 relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 transition-transform hover:rotate-0 overflow-hidden border-2 border-primary/10 p-1">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Join Karshaka Mitram
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Empowering Kerala's farmers with AI
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                <User className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                required
                                className="farmer-input pl-10 h-12"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

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
                                    <span>Create Account</span>
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
