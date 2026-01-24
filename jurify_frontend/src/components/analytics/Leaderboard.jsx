import React, { useEffect, useState } from 'react';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import { analyticsService } from '../../services/analyticsService';

const Leaderboard = ({ type = 'lawyers', limit = 10 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = type === 'lawyers'
                    ? await analyticsService.getTopLawyers(limit)
                    : await analyticsService.getTopNGOs(limit);
                setData(result || []);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
                setError('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type, limit]);

    const getRankBadge = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankBgColor = (rank) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-600/50';
        if (rank === 2) return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-800/30 border-gray-300 dark:border-gray-600/50';
        if (rank === 3) return 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 border-orange-300 dark:border-orange-600/50';
        return 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700';
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FiAward className="text-xl text-primary" />
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        Top {type === 'lawyers' ? 'Lawyers' : 'NGOs'}
                    </h3>
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <FiAward className="text-xl text-primary" />
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        Top 10 {type === 'lawyers' ? 'Lawyers' : 'NGOs'}
                    </h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                    <FiTrendingUp />
                    <span>Live</span>
                </div>
            </div>

            <div className="space-y-2">
                {data.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                        No data available yet
                    </p>
                ) : (
                    data.map((entry) => (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${getRankBgColor(entry.rank)}`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                                {getRankBadge(entry.rank)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {entry.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {entry.city}, {entry.state}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-primary text-lg">
                                    {entry.casesResolved}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    cases resolved
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
