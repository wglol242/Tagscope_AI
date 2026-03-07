import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaCog, FaMoon, FaSun, FaDownload } from 'react-icons/fa';
import AddBookmarkModal from './AddBookmarkModal';
import ConfigurationModal from './ConfigurationModal';
import { downloadData } from '../helpers/downloadHelper';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

function Header({
  darkMode,
  setDarkMode,
  refreshBookmarks,
  bookmarks,
}) {
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const handleDownload = () => {
    downloadData(bookmarks);
    setIsDownloadOptionsOpen(false);
  };

  // 외부 클릭 감지해서 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDownloadOptionsOpen(false);
      }
    }
    if (isDownloadOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDownloadOptionsOpen]);

  return (
    <>
      <header className="bg-grayBg dark:bg-gray-800 border-b-2 border-black py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-6">
          <div className="text-xl font-bold flex items-center space-x-2 text-blackText dark:text-white">
            <img src={logo} alt="Tagsnap AI Logo" className="h-10" />
            <a href="/" className="hover:underline">
              <h1 className="font-bruno-ace text-[30px]">Tagscope AI</h1>
            </a>
          </div>
          <div className="flex space-x-3 relative">
            {/* Add Bookmark Button */}
            <button
              onClick={() => setIsAddBookmarkModalOpen(true)}
              className="p-2 bg-green-500 text-white border-2 border-black rounded hover:bg-green-400"
            >
              <FaPlus />
            </button>

            {/* Download Button */}
            <div ref={dropdownRef}>
              <button
                onClick={() => setIsDownloadOptionsOpen(!isDownloadOptionsOpen)}
                className="p-2 bg-blue-500 text-white border-2 border-black rounded hover:bg-blue-400"
              >
                <FaDownload />
              </button>
              <AnimatePresence>
                {isDownloadOptionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border-2 border-black rounded z-50"
                  >
                    <button
                      onClick={handleDownload}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      HTML
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Configuration Button */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 bg-gray-200 dark:bg-gray-700 border-2 border-black rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <FaCog />
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-gray-600 dark:bg-gray-200 border border-black rounded hover:bg-gray-500 dark:hover:bg-gray-300"
            >
              {darkMode ? <FaSun color="orange" /> : <FaMoon color="#e6eaefff" />}
            </button>
          </div>
        </div>
      </header>

      {/* 모달들 */}
      <AddBookmarkModal
        isOpen={isAddBookmarkModalOpen}
        onClose={() => setIsAddBookmarkModalOpen(false)}
        refreshBookmarks={refreshBookmarks}
      />
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  );
}

export default Header;
