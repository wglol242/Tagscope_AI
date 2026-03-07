// src/components/SearchBar.js
import React, { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import apiService from '../apiService';

const ALL_TYPES = ["Media", "Blog", "News", "Public", "Social", "Tool", "Portal", "Etc"];

function SearchBar({ setSearchResults, setCurrentQuery, topTags = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [precision, setPrecision] = useState(false);
  const [loading, setLoading] = useState(false);   
  const topN = 10;

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const hasActiveFacet = selectedTypes.length > 0 || selectedTags.length > 0;
  const isIndicatorChecked = hasActiveFacet || precision;

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (
        showFilters &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setShowFilters(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showFilters]);

  const handleSearch = async () => {
    try {
      if (searchTerm.trim() === '') {
        setLoading(true);
        const allBookmarks = await apiService.getAllBookmarks();
        setSearchResults(allBookmarks);
        setCurrentQuery('');   
        return;
      }

      setLoading(true); 

      const results = await apiService.searchBookmarks(
        searchTerm,
        topN,
        precision,
        selectedTypes.join(","),
        selectedTags.join(",")
      );

      setSearchResults(results);
      setCurrentQuery(searchTerm);
    } catch (error) {
      console.error('검색 결과를 불러오는 중 오류 발생:', error);
    } finally {
      setLoading(false); 
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const onToggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const onToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="relative my-6 flex items-center space-x-3">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="북마크 검색"
          className="w-full pl-9 pr-9 py-2 border-2 border-black bg-grayBg dark:bg-gray-800 text-blackText dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

      
        <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <FaSearch className="text-gray-500 dark:text-gray-400" size={16} />
        </span>

        {loading && (
          <span className="absolute inset-y-0 right-2 flex items-center">
            <svg
              className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </span>
        )}
      </div>

      <label
        ref={triggerRef}
        className="flex items-center space-x-2 cursor-pointer select-none"
        onClick={() => setShowFilters((s) => !s)}
      >
        <input type="checkbox" checked={isIndicatorChecked} readOnly className="w-4 h-4" />
        <span className="text-sm text-gray-600 dark:text-gray-300">필터</span>
      </label>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-md border-2 border-black bg-white dark:bg-gray-800 text-blackText dark:text-white shadow-lg z-50"
          >
            <div className="p-3 space-y-4">
              {/* 고급 검색 옵션 */}
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  검색 옵션
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={precision}
                    onChange={(e) => setPrecision(e.target.checked)}
                  />
                  <span className="text-xs">고급 검색</span>
                </label>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  카테고리
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TYPES.map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5"
                        checked={selectedTypes.includes(type)}
                        onChange={() => onToggleType(type)}
                      />
                      <span className="text-xs">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {topTags?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Top Tags
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {topTags.slice(0, 12).map((tag) => (
                      <label key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={selectedTags.includes(tag)}
                          onChange={() => onToggleTag(tag)}
                        />
                        <span className="text-xs">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t-2 border-black">
              <button
                className="text-xs px-2 py-1 rounded border-2 border-black bg-white dark:bg-gray-800"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedTags([]);
                  setPrecision(false);
                }}
              >
                초기화
              </button>
              <button
                className="text-xs px-2 py-1 rounded border-2 border-black bg-green-400 text-white"
                onClick={() => {
                  setShowFilters(false);
                  handleSearch(); 
                }}
              >
                적용
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
