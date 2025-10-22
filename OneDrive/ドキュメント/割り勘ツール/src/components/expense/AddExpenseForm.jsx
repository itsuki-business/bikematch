import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddExpenseForm({ members, onAdd }) {
    const [payer, setPayer] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (payer && amount && parseFloat(amount) > 0) {
            onAdd({
                payer_name: payer,
                amount: parseFloat(amount),
                description: description.trim()
            });
            setAmount("");
            setDescription("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Select value={payer} onValueChange={setPayer}>
                <SelectTrigger className="border-indigo-200 focus:border-indigo-400 rounded-xl">
                    <SelectValue placeholder="支払った人を選択" />
                </SelectTrigger>
                <SelectContent>
                    {members.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                            {member.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="金額"
                className="border-indigo-200 focus:border-indigo-400 rounded-xl"
                min="1"
            />
            
            <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="内容（任意）"
                className="border-indigo-200 focus:border-indigo-400 rounded-xl"
            />
            
            <Button
                type="submit"
                disabled={!payer || !amount || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl py-6 text-base"
            >
                <PlusCircle className="w-5 h-5 mr-2" />
                支払いを記録
            </Button>
        </form>
    );
}