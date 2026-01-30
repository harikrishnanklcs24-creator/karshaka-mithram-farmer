import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, orderBy, doc, deleteDoc, where } from "firebase/firestore";
import { ShoppingBag, Plus, Image as ImageIcon, Tag, FileText, Loader2, TrendingUp, ArrowLeft, Trash2, MapPin, User } from "lucide-react";
import SellerTerms from "@/components/SellerTerms";
import { toast } from "sonner";

const Marketplace = () => {
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        title: "",
        rate: "",
        description: "",
        image: "",
        category: "vegetable"
    });

    useEffect(() => {
        const q = query(collection(db, "products"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prods);
        });
        return () => unsubscribe();
    }, []);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            console.error("Marketplace: No user found");
            return;
        }

        setLoading(true);
        console.log("Listing product for user:", user.uid);
        console.log("Product data:", newProduct);

        try {
            const docRef = await addDoc(collection(db, "products"), {
                ...newProduct,
                sellerId: user.uid,
                sellerName: userData?.name || "Anonymous Farmer",
                sellerDistrict: userData?.district || "Unknown Kerala",
                createdAt: new Date().toISOString()
            });

            console.log("Product listed successfully! ID:", docRef.id);
            toast.success("Product listed successfully!");
            setShowAddForm(false);
            setNewProduct({ title: "", rate: "", description: "", image: "", category: "vegetable" });
        } catch (error: any) {
            console.error("Marketplace error:", error);
            toast.error(`Error: ${error.message || "Failed to list product"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        try {
            await deleteDoc(doc(db, "products", productId));
            toast.success("Product deleted successfully");
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to delete product");
        }
    };

    const handleRequestProduct = async (product: any) => {
        if (!user) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "marketRequests"), {
                productId: product.id,
                productTitle: product.title,
                buyerId: user.uid,
                buyerName: userData?.name || "Interested Buyer",
                sellerId: product.sellerId,
                status: "pending",
                createdAt: new Date().toISOString()
            });
            toast.success("Interest sent to seller!");
        } catch (error) {
            console.error("Request failed:", error);
            toast.error("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    const myProductsCount = products.filter(p => p.sellerId === user?.uid).length;


    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "marketRequests"), where("sellerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(reqs);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen">
            <main className="max-w-5xl mx-auto p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace</h1>
                        <p className="text-slate-500 mt-1 font-medium">Buy and sell fresh farm products directly</p>
                    </div>
                    <button
                        onClick={() => setShowTerms(true)}
                        className="farmer-btn h-12 px-6 flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Sell Now</span>
                    </button>
                </div>

                {/* Seller Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Your Listings</p>
                                <p className="text-xl font-bold text-slate-900">{myProductsCount} Items</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Interest Received</p>
                                <p className="text-xl font-bold text-slate-900">{requests.length} Buyer Requests</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowRequestsModal(true)}
                            className="text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                        >
                            Manage All
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="h-48 bg-slate-100 relative">
                                {product.image ? (
                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black text-slate-900 shadow-sm flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        {product.category?.toUpperCase() || "VEGETABLE"}
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-2">
                                        <User className="h-3 w-3 text-primary" />
                                        {product.sellerName || "Anonymous Farmer"}
                                    </div>
                                </div>
                                {product.sellerId === user?.uid && (
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="absolute top-4 right-4 h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200 hover:bg-red-600"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">{product.title}</h3>
                                    <p className="text-primary font-black text-xl">₹{product.rate}</p>
                                </div>
                                <p className="text-slate-500 text-sm line-clamp-2">{product.description}</p>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{product.sellerDistrict || "Kerala"}</span>
                                        </div>
                                    </div>
                                    {product.sellerId !== user?.uid && (
                                        <button
                                            onClick={() => handleRequestProduct(product)}
                                            className="farmer-btn h-10 px-4 text-xs whitespace-nowrap"
                                        >
                                            Contact Seller
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Add Product Modal (Simple overlap for brevity) */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">List Item for Sale</h2>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Product Title</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        required
                                        className="farmer-input pl-12 h-14"
                                        placeholder="e.g. Organic Tomatoes"
                                        value={newProduct.title}
                                        onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Rate (₹ per kg/item)</label>
                                <input
                                    required
                                    type="number"
                                    className="farmer-input h-14"
                                    placeholder="e.g. 40"
                                    value={newProduct.rate}
                                    onChange={e => setNewProduct({ ...newProduct, rate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                                <select
                                    className="farmer-select h-14"
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                >
                                    <option value="vegetable">Vegetables</option>
                                    <option value="fruit">Fruits</option>
                                    <option value="grain">Grains/Spices</option>
                                    <option value="machinery">Machinery/Tools</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="farmer-input resize-none"
                                    placeholder="Tell us about the product..."
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Product Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="product-image-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setNewProduct({ ...newProduct, image: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('product-image-upload')?.click()}
                                    className={`w-full h-14 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${newProduct.image ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300 text-slate-400'
                                        }`}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                    {newProduct.image ? "Image Selected" : "Upload Product Image"}
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 h-14 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={loading}
                                    className="flex-[2] farmer-btn h-14 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "List Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Requests Modal */}
            {showRequestsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 animate-in zoom-in duration-300 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Buyer Requests</h2>
                            <button
                                onClick={() => setShowRequestsModal(false)}
                                className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                                <Plus className="h-5 w-5 text-slate-600 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {requests.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No requests received yet.</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{req.productTitle}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg">
                                                        {req.status?.toUpperCase() || 'PENDING'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-100/50">
                                            <p className="text-sm text-slate-600">
                                                <span className="font-semibold text-slate-900">Buyer:</span> {req.buyerName}
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <button className="flex-1 h-9 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                                                    Accept
                                                </button>
                                                <button className="flex-1 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Seller Terms Modal */}
            {showTerms && (
                <SellerTerms
                    onAgree={() => {
                        setShowTerms(false);
                        setShowAddForm(true);
                    }}
                    onCancel={() => setShowTerms(false)}
                />
            )}
        </div>
    );
};

export default Marketplace;
