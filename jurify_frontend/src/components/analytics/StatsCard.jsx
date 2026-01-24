import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", subtext }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      
      {(trend || trendValue) && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' && (
            <span className="text-green-600 flex items-center font-medium">
              ↑ {trendValue}
            </span>
          )}
          {trend === 'down' && (
            <span className="text-red-600 flex items-center font-medium">
              ↓ {trendValue}
            </span>
          )}
          <span className="text-gray-400 ml-2">vs last month</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
