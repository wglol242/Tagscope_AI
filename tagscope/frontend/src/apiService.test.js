import apiService from './apiService';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('apiService', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios); // Initialize a new Axios mock adapter before each test
  });

  afterEach(() => {
    mock.reset(); // Reset the mock adapter after each test
  });

  test('getAllBookmarks: should fetch all bookmarks', async () => {
    const mockData = [
      { link: 'https://example.com', summary: 'Example Summary', tags: ['tag1', 'tag2'] },
    ];

    mock.onGet('http://localhost:8000/bookmarks').reply(200, mockData); // Mock the GET request

    const bookmarks = await apiService.getAllBookmarks(); // Call the function

    expect(bookmarks).toEqual(mockData); // Assert the response
    expect(mock.history.get.length).toBe(1); // Ensure GET was called once
  });

  test('addBookmark: should add a new bookmark', async () => {
    const newBookmark = 'https://example.com';
    const mockResponse = { message: 'Bookmark added successfully.' };

    mock.onPost('http://localhost:8000/bookmarks').reply(200, mockResponse);

    const response = await apiService.addBookmark(newBookmark);

    expect(response).toEqual(mockResponse);
    expect(mock.history.post.length).toBe(1);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ url: newBookmark });
  });

  test('removeBookmark: should remove a bookmark', async () => {
    const bookmarkToRemove = 'https://example.com';
    const mockResponse = { message: 'Bookmark removed successfully.' };

    mock.onDelete('http://localhost:8000/bookmarks').reply(200, mockResponse);

    const response = await apiService.removeBookmark(bookmarkToRemove);

    expect(response).toEqual(mockResponse);
    expect(mock.history.delete.length).toBe(1);
    expect(JSON.parse(mock.history.delete[0].data)).toEqual({ url: bookmarkToRemove });
  });

  test('updateBookmark: should update a bookmark', async () => {
    const originalLink = 'https://old.com';
    const newLink = 'https://new.com';
    const newSummary = 'Updated Summary';
    const mockResponse = { message: 'Bookmark updated successfully.' };

    mock.onPut('http://localhost:8000/bookmarks').reply(200, mockResponse);

    const response = await apiService.updateBookmark(originalLink, newLink, newSummary);

    expect(response).toEqual(mockResponse);
    expect(mock.history.put.length).toBe(1);
    expect(JSON.parse(mock.history.put[0].data)).toEqual({
      original_link: originalLink,
      new_link: newLink,
      new_summary: newSummary,
    });
  });

  test('searchBookmarks: should perform a search', async () => {
    const query = 'example';
    const mockResponse = {
      query: 'example',
      count: 1,
      results: [
        { link: 'https://example.com', summary: 'Example result', tags: ['tag1'] },
      ],
    };

    mock.onGet('http://localhost:8000/search').reply(200, mockResponse);

    const results = await apiService.searchBookmarks(query);

    expect(results).toEqual(mockResponse.results);

    expect(mock.history.get.length).toBe(1);

    const url = mock.history.get[0].url;
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('query')).toBe(query);
  });
});
