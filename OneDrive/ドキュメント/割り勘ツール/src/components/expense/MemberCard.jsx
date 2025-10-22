import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function MemberCard({ member, onRemove, disabled }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
        >
            <div className="bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                <span className="font-medium text-gray-800">{member.name}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                    onClick={() => onRemove(member)}
                    disabled={disabled}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}