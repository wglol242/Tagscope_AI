import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiService = {
  // Get all bookmarks
  getAllBookmarks: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookmarks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  },

  // Add a new bookmark (single or multiple URLs)
  addBookmark: async (url) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bookmarks`, {
        url, // Can be a single string URL or an array of URLs
      });
      return response.data;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  },

  // Remove a bookmark (single or multiple URLs)
  removeBookmark: async (url) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/bookmarks`, {
        data: { url }, // Pass the URL(s) in the request body
      });
      return response.data;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  },

  // Update a bookmark
  updateBookmark: async (originalLink, newLink, newSummary) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/bookmarks`, {
        original_link: originalLink,
        new_link: newLink,
        new_summary: newSummary,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  },

  // 🔹 Search bookmarks with filters
  searchBookmarks: async (query, topN = 10, precision = false, types = "", tags = "") => {
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { 
          query, 
          top_n: topN, 
          precision,
          types,  
          tags     
        },
      });
      return response.data.results; 
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw error;
    }
  },

  // Get configuration
  getConfig: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/config`);
      return response.data;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  // Update configuration
  updateConfig: async (googleApiKey) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/config`, {
        google_api_key: googleApiKey,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  },

  // Test models
  testModels: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/test_models`);
      return response.data;
    } catch (error) {
      console.error('Error testing models:', error);
      throw error;
    }
  },
};

export default apiService;
