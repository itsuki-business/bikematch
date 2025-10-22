import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function AddMemberForm({ onAdd }) {
    const [memberName, setMemberName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (memberName.trim()) {
            onAdd(memberName.trim());
            setMemberName("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="メンバー名を入力"
                className="flex-1 border-indigo-200 focus:border-indigo-400 rounded-xl"
            />
            <Button
                type="submit"
                disabled={!memberName.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl px-6"
            >
                <Plus className="w-4 h-4 mr-1" />
                追加
            </Button>
        </form>
    );
}