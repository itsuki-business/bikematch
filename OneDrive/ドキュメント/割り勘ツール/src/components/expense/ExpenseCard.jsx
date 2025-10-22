import React from "react";
import { Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ExpenseCard({ expense, onDelete }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-gray-800">{expense.payer_name}</span>
                    </div>
                    {expense.description && (
                        <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                    )}
                    <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ¥{expense.amount.toLocaleString()}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(expense)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}