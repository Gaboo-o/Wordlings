import axios from 'axios';

export const fetchWords = async () => {
  const res = await axios.get('/api/words');
  return res.data;
};

export const addWord = async (wordData) => {
  const res = await axios.post('/api/words', wordData);
  return res.data;
};

export const upvoteWord = async (id) => {
  const res = await axios.post(`/api/words/upvote/${id}`);
  return res.data;
};
