import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import BookmarkList from './components/BookmarkList';
import apiService from './apiService';

function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentQuery, setCurrentQuery] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = sessionStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const fetchedBookmarks = await apiService.getAllBookmarks();
      setBookmarks(fetchedBookmarks);
    } catch (err) {
      setError('Failed to fetch bookmarks. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBookmarks = async () => {
    try {
      setLoading(true);
      if (currentQuery) {
        const results = await apiService.searchBookmarks(currentQuery);
        setSearchResults(results);
      } else {
        const fetchedBookmarks = await apiService.getAllBookmarks();
        setBookmarks(fetchedBookmarks);
      }
    } catch (err) {
      setError('Failed to refresh bookmarks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchByTag = async (tag) => {
    try {
      setLoading(true);
      setCurrentQuery(tag);
      const results = await apiService.searchBookmarks(tag);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search bookmarks by tag. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    sessionStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  if (loading) {
    return <div className="text-center mt-10">Loading bookmarks...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  const inSearchMode = currentQuery.trim().length > 0;
  const displayBookmarks = inSearchMode ? searchResults : bookmarks;

  return (
    <div className="min-h-screen bg-grayBg dark:bg-gray-900 font-retro text-blackText dark:text-white">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        refreshBookmarks={fetchBookmarks}
        bookmarks={bookmarks}
      />
      <main className="max-w-4xl mx-auto px-6">
        <SearchBar 
          setSearchResults={setSearchResults} 
          setCurrentQuery={setCurrentQuery}
        />

        {inSearchMode && searchResults.length === 0 ? (
          <div className="text-center mt-6 text-gray-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <BookmarkList 
            bookmarks={displayBookmarks} 
            refreshBookmarks={refreshBookmarks}
            searchByTag={searchByTag}
          />
        )}
      </main>
    </div>
  );
}

export default App;
