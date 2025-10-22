import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SettlementCard({ from, to, amount, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-5 shadow-lg"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
                        <span className="font-bold text-gray-800">{from}</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-indigo-400" />
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
                        <span className="font-bold text-gray-800">{to}</span>
                    </div>
                </div>
                <div className="text-right ml-4">
                    <p className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ¥{Math.round(amount).toLocaleString()}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}