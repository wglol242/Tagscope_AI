import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../apiService';

function AddBookmarkModal({ isOpen, onClose, refreshBookmarks }) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const urlArray = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '' && isValidUrl(url));

    if (urlArray.length === 0) {
      alert('유효한 URL을 하나 이상 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await apiService.addBookmark(urlArray.length === 1 ? urlArray[0] : urlArray);
      alert('북마크 추가완료!');
      setUrls('');
      onClose();
      refreshBookmarks();
    } catch (error) {
      console.error('Error adding bookmarks:', error);
      alert('북마크 추가실패. 잠시 후 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose} 
        >
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-xl w-full relative border-2 border-black"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={loading}
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b-2 border-black pb-2">
              새 북마크 추가
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  URL 입력 (한 줄에 하나씩 입력해주세요)
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={5}
                  placeholder={`https://example.com\nhttps://another-example.com`}
                  className="w-full p-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
              </div>
              <div className="flex justify-between space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={
                   `w-full py-2 rounded border-2 border-black transition-colors ` +
                   (loading
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-200'
                      : 'bg-green-500 hover:bg-green-400 text-white')
                  }
                  aria-busy={loading}
                >
                  {loading ? '추가중...' : '북마크 추가'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-gray-200 text-black dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition border-2 border-black"
                  disabled={loading}
                >
                  취소
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddBookmarkModal;
