import React, { useState } from 'react';
import Bookmark from './Bookmark';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import FacetFilter from "./FacetFilter";

function BookmarkList({ bookmarks, refreshBookmarks, searchByTag }) {
  const [currentPage, setCurrentPage] = useState(1);
  const bookmarksPerPage = 10;

  const tagCounts = {};
  bookmarks.forEach((bm) => {
    (bm.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  let topTags = sortedTags.slice(0, 6).map(([tag]) => tag);

  // 중복이 전혀 없으면 랜덤 선택
  if (sortedTags.every(([_, count]) => count === 1)) {
    topTags = sortedTags
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
      .map(([tag]) => tag);
  }

  const filteredBookmarks = bookmarks.filter(
    (bm) => bm.total_score === undefined || bm.total_score > 0.7
  );

  const totalPages = Math.max(1, Math.ceil(filteredBookmarks.length / bookmarksPerPage));

  const indexOfLastBookmark = currentPage * bookmarksPerPage;
  const indexOfFirstBookmark = indexOfLastBookmark - bookmarksPerPage;
  const currentBookmarks = filteredBookmarks.slice(indexOfFirstBookmark, indexOfLastBookmark);

  const isMobile = window.innerWidth < 640;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageDisplay = isMobile ? 1 : 3;

    if (totalPages <= 5 + maxPageDisplay) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage > maxPageDisplay + 1) {
        pageNumbers.push(1, '...');
      }

      const start = Math.max(2, currentPage - maxPageDisplay);
      const end = Math.min(totalPages - 1, currentPage + maxPageDisplay);
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - maxPageDisplay) {
        pageNumbers.push('...', totalPages);
      }
    }

    return pageNumbers;
  };

  const paginate = (pageNumber) => {
    if (pageNumber !== '...') {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="pb-6">
      <FacetFilter
        topTags={topTags}
        onTagClick={(tag) => {
          setCurrentPage(1);
          searchByTag(tag);
        }}
      />

      <div className="space-y-4">
        <AnimatePresence>
          {currentBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.link}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Bookmark
                bookmark={bookmark}
                refreshBookmarks={refreshBookmarks}
                onTagClick={(tag) => {
                  setCurrentPage(1);
                  searchByTag(tag);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-4 space-x-1 sm:space-x-2">
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-1 sm:p-2 border-2 border-black rounded ${
            currentPage === 1
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
              : 'bg-white dark:bg-gray-800 text-black dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FaArrowLeft size={isMobile ? 12 : 16} />
        </button>
        {getPageNumbers().map((pageNumber, index) => (
          <button
            key={index}
            onClick={() => paginate(pageNumber)}
            disabled={pageNumber === '...'}
            className={`p-1 sm:p-2 border-2 border-black rounded ${
              currentPage === pageNumber
                ? 'bg-white text-black'
                : pageNumber === '...'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                : 'bg-white dark:bg-gray-800 text-black dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={isMobile ? { fontSize: '0.75rem', minWidth: '2rem' } : {}}
          >
            {pageNumber}
          </button>
        ))}
        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-1 sm:p-2 border-2 border-black rounded ${
            currentPage === totalPages
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
              : 'bg-white dark:bg-gray-800 text-black dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FaArrowRight size={isMobile ? 12 : 16} />
        </button>
      </div>
    </div>
  );
}

export default BookmarkList;
