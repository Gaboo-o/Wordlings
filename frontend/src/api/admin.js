import axios from 'axios';
import { csrfHeader } from './_csrf';

export const getPending = async () =>
  (await axios.get('/api/admin/pending', { withCredentials: true })).data;
export const approve = async (id) =>
  (await axios.post(`/api/admin/approve/${id}`, {}, { withCredentials: true, headers: csrfHeader() })).data;
export const reject = async (id) =>
  (await axios.post(`/api/admin/reject/${id}`, {}, { withCredentials: true })).data;
