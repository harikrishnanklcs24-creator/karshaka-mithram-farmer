import { ShieldCheck, Tag, TrendingUp, Users, CheckCircle, X } from "lucide-react";

interface SellerTermsProps {
    onAgree: () => void;
    onCancel: () => void;
}

const SellerTerms = ({ onAgree, onCancel }: SellerTermsProps) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-xl">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Seller Agreement</h2>
                            <p className="text-sm text-slate-500 font-medium">Commission Policy & Terms</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 1. Category Based */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Tag className="h-4 w-4" />
                            <h3>1. Product Category Commissions</h3>
                        </div>
                        <div className="grid gap-3 pl-6">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-900">Low-Margin (5-8%)</span>
                                <p className="text-xs text-slate-500 mt-1">Seeds, basic manure, fertilizers. High volume, price-sensitive.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-900">Mid-Margin (8-12%)</span>
                                <p className="text-xs text-slate-500 mt-1">Bio-pesticides, organic inputs, micronutrients.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-900">High-Margin (12-18%)</span>
                                <p className="text-xs text-slate-500 mt-1">Premium organic solutions, smart agri tools.</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Value Based */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <TrendingUp className="h-4 w-4" />
                            <h3>2. Value-Based Safeguards</h3>
                        </div>
                        <ul className="list-disc list-inside text-sm text-slate-600 pl-6 space-y-1">
                            <li><span className="font-bold">Cap on Commissions:</span> Maximum fee limit for very high-value items.</li>
                            <li><span className="font-bold">Minimum Floor:</span> Small fixed fee for very low-priced items to cover costs.</li>
                        </ul>
                    </section>

                    {/* 3. AI Incentive */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <CheckCircle className="h-4 w-4" />
                            <h3>3. AI-Driven Incentives</h3>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">
                                Products recommended by our AI Diagnosis get <span className="font-bold">+2-3% visibility premium</span> (only on successful sale).
                            </p>
                        </div>
                    </section>

                    {/* 4. Seller Type */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Users className="h-4 w-4" />
                            <h3>4. Seller Type Adjustments</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-6">
                            <div className="text-center p-3 border border-slate-100 rounded-xl">
                                <div className="text-xs font-bold text-slate-400 mb-1">Cooperatives</div>
                                <div className="text-green-600 font-bold">Lower Rates</div>
                            </div>
                            <div className="text-center p-3 border border-slate-100 rounded-xl">
                                <div className="text-xs font-bold text-slate-400 mb-1">Govt Approved</div>
                                <div className="text-blue-600 font-bold">Priority Listing</div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem]">
                    <p className="text-xs text-slate-400 text-center mb-4">
                        By clicking "I Agree", you accept these terms and commissions for all products listed on Karshaka Mitra.
                    </p>
                    <button
                        onClick={onAgree}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-lg hover:shadow-green-200"
                    >
                        I Agree & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellerTerms;
