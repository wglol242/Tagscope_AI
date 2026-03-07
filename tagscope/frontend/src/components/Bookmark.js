import { motion } from 'framer-motion';
import { FaCheck, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import React, { useState } from 'react';
import apiService from '../apiService';

function Bookmark({ bookmark, refreshBookmarks, onTagClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedLink, setUpdatedLink] = useState(bookmark.link);
  const [updatedSummary, setUpdatedSummary] = useState(bookmark.summary);
  const [isHovered, setIsHovered] = useState(false); 

  const handleUpdate = async () => {
    try {
      await apiService.updateBookmark(bookmark.link, updatedLink, updatedSummary);
      refreshBookmarks();
      setIsEditing(false);
    } catch (error) {
      console.error('북마크 업데이트에 실패했습니다:', error);
      alert('북마크 업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('이 북마크를 정말로 삭제하시겠습니까?')) {
      try {
        await apiService.removeBookmark(bookmark.link);
        refreshBookmarks();
      } catch (error) {
        console.error('북마크 삭제에 실패했습니다:', error);
        alert('북마크 삭제에 실패했습니다.');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdatedLink(bookmark.link);
    setUpdatedSummary(bookmark.summary);
  };

  return (
    <motion.div
      className="p-4 border-2 border-black bg-white dark:bg-gray-800 rounded mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        type: 'spring',
        stiffness: 100,
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="w-full sm:w-auto flex-1 mr-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={updatedLink}
                onChange={(e) => setUpdatedLink(e.target.value)}
                className="w-full p-2 border border-black rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                value={updatedSummary}
                onChange={(e) => setUpdatedSummary(e.target.value)}
                rows={3}
                className="w-full p-2 border border-black rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold flex items-center space-x-2 text-blackText dark:text-white relative">
                {/* 파비콘 */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${bookmark.base_url}&sz=32`}
                  alt="favicon"
                  className="w-5 h-5"
                />
                {/* summary를 클릭 가능한 링크로 */}
                <a
                  href={bookmark.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all hover:underline"
                  onMouseEnter={() => setIsHovered(true)}   
                  onMouseLeave={() => setIsHovered(false)}  
                >
                  {bookmark.summary || bookmark.link}
                </a>

                {isHovered && bookmark.image_url && (
                  <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
                    <img
                      src={bookmark.image_url}
                      alt="preview"
                      className="w-48 h-auto rounded"
                    />
                  </div>
                )}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words">
                {bookmark.source_type || 'Etc'}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {bookmark.tags?.map((tag, index) => (
              <motion.span
                key={index}
                onClick={() => onTagClick(tag)}
                className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-500 text-blue-700 dark:text-blue-200 border border-blue-700 dark:border-blue-200 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdate}
                className="p-2 bg-green-500 text-white border-2 border-black rounded hover:bg-green-400"
                title="변경 내용 저장"
              >
                <FaCheck />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 bg-red-500 border-2 border-black text-white rounded hover:bg-gray-300 dark:hover:bg-red-300"
                title="취소"
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-gray-200 dark:bg-gray-700 border-2 border-black rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              title="북마크 수정"
            >
              <FaEdit />
            </button>
          )}
          {!isEditing && (
            <button
              onClick={handleDelete}
              className="p-2 bg-red-500 text-white border-2 border-black rounded hover:bg-red-300"
              title="북마크 삭제"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Bookmark;
