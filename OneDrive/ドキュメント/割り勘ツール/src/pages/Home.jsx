import React, { useState, useEffect } from "react";
import { membersRepo, expensesRepo } from "@/lib/store/localStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calculator, RefreshCw, Users, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatePresence } from "framer-motion";

import MemberCard from "../components/expense/MemberCard";
import AddMemberForm from "../components/expense/AddMemberForm";
import ExpenseCard from "../components/expense/ExpenseCard";
import AddExpenseForm from "../components/expense/AddExpenseForm";
import SettlementCard from "../components/expense/SettlementCard";
import BannerAd from "../components/expense/BannerAd";

export default function Home() {
    const [sessionId, setSessionId] = useState("");
    const queryClient = useQueryClient();

    useEffect(() => {
        let sid = localStorage.getItem("expense_session_id");
        if (!sid) {
            sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem("expense_session_id", sid);
        }
        setSessionId(sid);
    }, []);

    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ['members', sessionId],
        queryFn: () => membersRepo.list(sessionId),
        enabled: !!sessionId,
    });

    const { data: expenses = [], isLoading: expensesLoading } = useQuery({
        queryKey: ['expenses', sessionId],
        queryFn: () => expensesRepo.list(sessionId),
        enabled: !!sessionId,
    });

    const createMemberMutation = useMutation({
        mutationFn: (name) => membersRepo.create(sessionId, { name }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
    });

    const deleteMemberMutation = useMutation({
        mutationFn: (id) => membersRepo.delete(sessionId, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
    });

    const createExpenseMutation = useMutation({
        mutationFn: (expenseData) => expensesRepo.create(sessionId, expenseData),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: (id) => expensesRepo.delete(sessionId, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    });

    const handleReset = async () => {
        if (window.confirm("すべてのデータをリセットしますか？")) {
            await Promise.all([
                ...members.map(m => membersRepo.delete(sessionId, m.id)),
                ...expenses.map(e => expensesRepo.delete(sessionId, e.id))
            ]);
            queryClient.invalidateQueries();
        }
    };

    const calculateSettlements = () => {
        if (members.length === 0 || expenses.length === 0) return [];

        const balances = {};
        members.forEach(m => balances[m.name] = 0);

        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        const perPerson = totalAmount / members.length;

        expenses.forEach(expense => {
            balances[expense.payer_name] += expense.amount;
        });

        members.forEach(m => {
            balances[m.name] -= perPerson;
        });

        const debtors = [];
        const creditors = [];

        Object.entries(balances).forEach(([name, balance]) => {
            if (balance < -0.01) {
                debtors.push({ name, amount: -balance });
            } else if (balance > 0.01) {
                creditors.push({ name, amount: balance });
            }
        });

        const settlements = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            const amount = Math.min(debtor.amount, creditor.amount);

            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount
            });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        return settlements;
    };

    const settlements = calculateSettlements();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const hasExpensesForNonExistentMembers = expenses.some(
        expense => !members.find(m => m.name === expense.payer_name)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-6">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
                        <Calculator className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        立替精算
                    </h1>
                    <p className="text-gray-600 text-lg">サクッと記録、即座に精算</p>
                </div>

                {/* Banner Ad */}
                <div className="mb-8">
                    <BannerAd />
                </div>

                {/* Members Section */}
                <Card className="mb-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users className="w-6 h-6" />
                            メンバー
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <AddMemberForm onAdd={(name) => createMemberMutation.mutate(name)} />
                        
                        {members.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                                <AnimatePresence>
                                    {members.map((member) => (
                                        <MemberCard
                                            key={member.id}
                                            member={member}
                                            onRemove={(m) => deleteMemberMutation.mutate(m.id)}
                                            disabled={expenses.some(e => e.payer_name === member.name)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Expense Section */}
                {members.length > 0 && (
                    <Card className="mb-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Wallet className="w-6 h-6" />
                                支払いを記録
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AddExpenseForm
                                members={members}
                                onAdd={(data) => createExpenseMutation.mutate(data)}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Expenses List */}
                {expenses.length > 0 && (
                    <Card className="mb-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    支払い履歴
                                </CardTitle>
                                <div className="text-right">
                                    <p className="text-sm opacity-90">合計</p>
                                    <p className="text-2xl font-bold">¥{totalExpenses.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {expenses.map((expense) => (
                                        <ExpenseCard
                                            key={expense.id}
                                            expense={expense}
                                            onDelete={(e) => deleteExpenseMutation.mutate(e.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Warning for non-existent members */}
                {hasExpensesForNonExistentMembers && (
                    <Alert variant="destructive" className="mb-8 rounded-2xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            削除されたメンバーの支払いが含まれています。正確な精算のため、該当する支払いを削除してください。
                        </AlertDescription>
                    </Alert>
                )}

                {/* Settlement Results */}
                {settlements.length > 0 && members.length > 0 && !hasExpensesForNonExistentMembers && (
                    <Card className="mb-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Calculator className="w-6 h-6" />
                                精算結果
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {settlements.map((settlement, index) => (
                                        <SettlementCard
                                            key={index}
                                            {...settlement}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reset Button */}
                {(members.length > 0 || expenses.length > 0) && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="rounded-xl border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            すべてリセット
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {members.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            メンバーを追加しましょう
                        </h2>
                        <p className="text-gray-600">
                            立替精算を始めるには、まずメンバーを追加してください
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}