import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../apiService';

function ConfigurationModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setTestResult(null);
      try {
        setLoading(true);
        const config = await apiService.getConfig();
        setApiKey(config.google_api_key || '');
      } catch (err) {
        setError('설정을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const handleSaveConfig = async () => {
    if (!apiKey) {
      alert('유효한 API 키를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await apiService.updateConfig(apiKey);
      alert('API 키가 설정되었습니다.');
    } catch (err) {
      setError('설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestModels = async () => {
    setTestResult(null);
    setError(null);
    try {
      setLoading(true);
      const response = await apiService.testModels();
      setTestResult(response.message);
    } catch (err) {
      setError('API 키 검사에 실패했습니다. 키를 확인하고 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose} 
        >
          <motion.div
            key="config-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg border-2 border-black relative"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 border-b-2 border-black pb-2">
              API 설정
            </h2>
            {loading && <div className="text-center text-gray-800 dark:text-gray-200">Loading...</div>}
            {error && <div className="text-center text-red-500 mb-4">{error}</div>}
            {testResult && <div className="text-center text-green-500 mb-4">{testResult}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  구글 API 키
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your Google API Key"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                className="w-full py-2 bg-green-500 text-white border-2 border-black rounded hover:bg-green-400 transition"
                disabled={loading}
              >
                설정 저장
              </button>
            </div>
            <div className="mt-8 flex space-x-3">
              <button
                onClick={handleTestModels}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white border-2 border-black rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                disabled={loading}
              >
                API 키 검사
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white border-2 border-black rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfigurationModal;
