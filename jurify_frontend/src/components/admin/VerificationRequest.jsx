import React from "react";

export default function VerificationRequest({
    verificationsPoll,
    bulkSelection,
    setBulkSelection,
    bulkApprove,
    setSelectedVerification
}) {
    return (
        /* Keeping your exact background and border classes */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Verification Requests
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={bulkApprove}
                        className="px-3 py-1 rounded-md bg-primary text-white text-sm hover:bg-primary-dark transition"
                    >
                        Approve Selected
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-gray-500 dark:text-gray-400 text-xs border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="pb-3 pr-4">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked)
                                            setBulkSelection(
                                                new Set((verificationsPoll.data || []).map((v) => v.id))
                                            );
                                        else setBulkSelection(new Set());
                                    }}
                                />
                            </th>
                            <th className="pb-3 font-semibold">Name</th>
                            <th className="pb-3 font-semibold">Type</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Submitted</th>
                            <th className="pb-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(verificationsPoll.loading
                            ? Array.from({ length: 4 })
                            : verificationsPoll.data || []
                        ).map((v, i) => (
                            <tr
                                key={v?.id ?? i}
                                className="border-b border-gray-100 dark:border-gray-700"
                            >
                                <td className="py-3 pr-4">
                                    <input
                                        type="checkbox"
                                        checked={bulkSelection.has(v?.id)}
                                        onChange={(e) => {
                                            const next = new Set(bulkSelection);
                                            if (e.target.checked) next.add(v.id);
                                            else next.delete(v.id);
                                            setBulkSelection(next);
                                        }}
                                    />
                                </td>
                                <td className="py-3">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {v?.name ?? (
                                            <span className="text-gray-400">Loading...</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {v?.type}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${v?.status === "PENDING"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : v?.status === "APPROVED"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {v?.status}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {v ? new Date(v.submittedAt).toLocaleDateString() : ""}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedVerification(v)}
                                            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                        >
                                            View
                                        </button>
                                        {v?.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedVerification(v)}
                                                    className="px-2 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setSelectedVerification(v)}
                                                    className="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}