import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiShield, FiActivity, FiUsers, FiClock,
    FiDownload, FiSearch, FiFilter, FiExternalLink,
    FiCpu, FiTerminal, FiAlertCircle
} from "react-icons/fi";
// Ensure Chart.js is registered for the Line chart
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

import { verificationService } from "../../services/verificationService";
import { useTheme } from "../../context/ThemeContext";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AuditLogViewer() {
    const [logs, setLogs] = useState([]);
    const [availableActions, setAvailableActions] = useState([]);

    // Filter state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    // Fetch available actions for dropdown
    useEffect(() => {
        verificationService.fetchAuditActions().then(actions => {
            setAvailableActions(actions || []);
        }).catch(() => { });
    }, []);

    // Fetch logs with filters
    useEffect(() => {
        const params = {};
        if (startDate) params.startDate = new Date(startDate).toISOString();
        if (endDate) params.endDate = new Date(endDate).toISOString();
        if (actionFilter) params.action = actionFilter;

        verificationService.fetchAuditLogs(params).then(data => {
            if (data?.items) {
                setLogs(data.items);
            }
        });
    }, [startDate, endDate, actionFilter]);

    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("All");
    const [active, setActive] = useState(null);

    const { isDarkMode } = useTheme();

    // Dynamic Heatmap Data (24h)
    const heatmapData = React.useMemo(() => {
        const counts = new Array(24).fill(0);
        logs.forEach(log => {
            try {
                const h = new Date(log.time).getHours();
                if (h >= 0 && h < 24) counts[h]++;
            } catch (e) { }
        });
        return counts;
    }, [logs]);

    // Dynamic Chart Data (4h intervals)
    const chartData = React.useMemo(() => {
        const buckets = [0, 0, 0, 0, 0, 0, 0];
        logs.forEach(log => {
            try {
                const h = new Date(log.time).getHours();
                // 0-3->0, 4-7->1, 8-11->2, 12-15->3, 16-19->4, 20-23->5
                let idx = Math.floor(h / 4);
                if (idx > 6) idx = 6;
                buckets[idx]++;
            } catch (e) { }
        });

        return {
            labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
            datasets: [{
                label: "System Events",
                data: buckets,
                borderColor: isDarkMode ? "#818cf8" : "#6366f1",
                backgroundColor: isDarkMode ? "rgba(129, 140, 248, 0.15)" : "rgba(99, 102, 241, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: isDarkMode ? "#818cf8" : "#6366f1",
                pointBorderColor: isDarkMode ? "#c7d2fe" : "#818cf8"
            }]
        };
    }, [logs, isDarkMode]);

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDarkMode ? '#f1f5f9' : '#1e293b',
                bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
                borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    font: { size: 10 }
                }
            },
            y: {
                grid: {
                    color: isDarkMode ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.15)"
                },
                ticks: {
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    font: { size: 10 }
                }
            }
        }
    };

    const filtered = logs.filter(l =>
        (l.user + l.action + l.ip).toLowerCase().includes(search.toLowerCase()) &&
        (severity === "All" || l.status === severity)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Audit Intelligence</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Monitoring system-wide mutations and auth clusters.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const headers = ['ID', 'User', 'Action', 'Module', 'Status', 'IP', 'Time'];
                            const csvContent = [
                                headers.join(','),
                                ...filtered.map(log => [
                                    log.id,
                                    `"${log.user}"`,
                                    `"${log.action}"`,
                                    log.module,
                                    log.status,
                                    log.ip,
                                    `"${log.time}"`
                                ].join(','))
                            ].join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
                    >
                        <FiDownload className="inline mr-2" /> Export Database
                    </button>
                </div>
            </div>

            {/* TOP ANALYTICS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Trend Graph */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-6 rounded-[2rem] h-72 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Event Propagation Trend</h3>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg font-bold">+14.2% Stability</span>
                    </div>
                    <div className="h-48">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Intensity Heatmap */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6">Activity Density (24h)</h3>
                    <div className="grid grid-cols-6 gap-2">
                        {heatmapData.map((val, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                className="h-10 rounded-md cursor-help relative group"
                                style={{
                                    backgroundColor: isDarkMode ? `rgba(107, 114, 128, ${val / 40})` : `rgba(107, 114, 128, ${val / 50})`,
                                    border: val > 40 ? (isDarkMode ? '1px solid #94a3b8' : '1px solid #6b7280') : (isDarkMode ? '1px solid rgba(107, 114, 128, 0.2)' : '1px solid rgba(107, 114, 128, 0.1)')
                                }}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                    <div className={`text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-xl ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-900'}`}>
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-white'}>{i}:00 — {val} Events</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                        <span>00:00 (Low)</span>
                        <span>23:59 (High)</span>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-2xl shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search by ID, User, Action or IP..."
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl py-2 pl-11 pr-4 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">From:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">To:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none"
                        />
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none"
                    >
                        <option value="">All Actions</option>
                        {availableActions.map(action => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                        ))}
                    </select>

                    {/* Severity Filter */}
                    <select
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none"
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        <option value="All">All Severity</option>
                        <option value="Critical">Critical</option>
                        <option value="Warning">Warning</option>
                        <option value="Success">Success</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setActionFilter("");
                            setSeverity("All");
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* LOG DATA TABLE */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <tr className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <th className="px-8 py-5">Actor Info</th>
                                <th>Activity / Module</th>
                                <th>Threat Status</th>
                                <th>Timestamp</th>
                                <th className="px-8 text-right">Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filtered.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr
                                        onClick={() => setActive(active?.id === log.id ? null : log)}
                                        className={`cursor-pointer transition-all ${active?.id === log.id ? 'bg-indigo-50 dark:bg-gray-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {log.user[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{log.user}</p>
                                                    <p className={`text-[10px] font-mono italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.ip}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded uppercase font-black text-gray-500 dark:text-gray-400">
                                                    {log.module}
                                                </span>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.action}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${log.status === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700' :
                                                log.status === 'Warning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-mono text-xs`}>{log.time}</td>
                                        <td className="px-8 text-right">
                                            <FiExternalLink className={`inline text-lg transition-colors ${active?.id === log.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-400'}`} />
                                        </td>
                                    </tr>

                                    <AnimatePresence>
                                        {active?.id === log.id && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-gray-50/50 dark:bg-gray-800/50"
                                            >
                                                <td colSpan="5" className="px-8 py-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                                            <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                                                <FiCpu /> Execution Metadata
                                                            </h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-500 dark:text-gray-400">Device Signature</span>
                                                                    <span className="text-gray-700 dark:text-gray-300">{log.device}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-500 dark:text-gray-400">Event ID</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-300 font-mono">{log.id}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                                            <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                                                <FiTerminal /> Payload Data
                                                            </h4>
                                                            <pre className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400/80 whitespace-pre-wrap">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SYSTEM STATUS FOOTER */}
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 rounded-xl">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60">
                    <span className="flex items-center gap-2"><FiActivity className="animate-pulse" /> Live Stream Active</span>
                </div>
            </div>
        </div>
    );
}