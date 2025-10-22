import React from "react";
import { Camera, Bike, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1600')] bg-cover bg-center" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600 rounded-xl">
              <Bike className="w-8 h-8" />
            </div>
            <div className="p-3 bg-red-600 rounded-xl">
              <Camera className="w-8 h-8" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            あなたの愛車を<br />
            <span className="text-red-500">最高の一枚</span>に
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            バイク専門フォトグラファーとマッチング。<br />
            ツーリングの思い出、カスタムバイクの記録、サーキット走行の瞬間を、<br />
            プロの技術で美しく残しませんか？
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">無料マッチング</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <span className="font-semibold">直接交渉</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <span className="font-semibold">相互評価</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}