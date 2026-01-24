import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const CaseDistributionChart = ({ data, title, legendPosition = "bottom" }) => {
  const { isDarkMode } = useTheme();

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0];
      const percent = ((dataItem.value / total) * 100).toFixed(1);
      return (
        <div style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: isDarkMode ? '#fff' : '#111827'
        }}>
          <p className="font-medium">{dataItem.name}</p>
          <p className="text-sm">
            Count: <span className="font-bold">{dataItem.value}</span>
          </p>
          <p className="text-sm">
            Share: <span className="font-bold">{percent}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>

      {(!data || data.length === 0 || data.every(d => d.value === 0)) ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px] text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p>No distribution data available</p>
          </div>
        </div>
      ) : (
        <div className="h-[300px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout={legendPosition === 'right' ? 'vertical' : 'horizontal'}
                verticalAlign={legendPosition === 'right' ? 'middle' : 'bottom'}
                align={legendPosition === 'right' ? 'right' : 'center'}
                wrapperStyle={legendPosition === 'right' ? { paddingLeft: '20px' } : { paddingTop: '20px' }}
                formatter={(value) => <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default CaseDistributionChart;
