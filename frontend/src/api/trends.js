import axios from 'axios';

export const fetchTrends = async () => {
  const res = await axios.get('/api/trends');
  // backend earlier returned HTML for map, we'll forward whole payload
  return res.data;
};
