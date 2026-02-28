import axios from 'axios';

const SERVER = process.env.REACT_APP_SERVER_URL || '';

const api = axios.create({
    baseURL: `${SERVER}/api`,
    withCredentials: true,
});

export default api;