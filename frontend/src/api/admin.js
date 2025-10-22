import axios from 'axios';

export const getPending = async () => {
  const res = await axios.get('/api/admin/pending');
  return res.data;
};

export const approve = async (id) => {
  const res = await axios.post(`/api/admin/approve/${id}`);
  return res.data;
};

export const reject = async (id) => {
  const res = await axios.post(`/api/admin/reject/${id}`);
  return res.data;
};
