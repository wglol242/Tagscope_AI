import React from "react";
import { motion } from "framer-motion";

function FacetFilter({ topTags = [], onTagClick }) {
  return (
    <motion.div
      className="mb-4 flex items-center flex-wrap gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 제목 */}
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        연관 태그:
      </span>

      {/* 태그 버튼 */}
      {topTags.slice(0, 5).map((tag, i) => (
        <motion.button
          key={i}
          onClick={() => onTagClick(tag)}
          className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-500 text-blue-700 dark:text-blue-200 border border-blue-700 dark:border-blue-200 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tag}
        </motion.button>
      ))}
    </motion.div>
  );
}

export default FacetFilter;
