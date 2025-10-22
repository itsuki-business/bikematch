import React from "react";

export default function BannerAd() {
    return (
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">広告</p>
            <div className="h-20 flex items-center justify-center bg-white/50 rounded-xl">
                <p className="text-gray-400 text-sm">バナー広告エリア</p>
            </div>
        </div>
    );
}