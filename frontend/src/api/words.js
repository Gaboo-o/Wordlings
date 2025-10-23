import axios from 'axios';

export const fetchWords = async (params = {}) => {
  const res = await axios.get('/api/words', { params });
  return res.data;
};

export const fetchWordById = async (id) => {
  const res = await axios.get(`/api/words/${id}`);
  return res.data;
};

export const searchWords = async (searchTerm) => {
  const res = await axios.get('/api/words/search', {
    params: { search: searchTerm }
  });
  return res.data;
};

export const addWord = async ({ word, definition, examples }) => {
  const res = await axios.post('/api/words/add', {
    word,
    definition,
    examples
  });
  return res.data;
};

export const upvoteWord = async (id) => {
  const res = await axios.post(`/api/words/upvote/${id}`);
  return res.data;
};