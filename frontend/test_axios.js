const axios = require('axios');
const api = axios.create({ headers: { "Content-Type": "application/json" } });

// Hook into request to see final headers
api.interceptors.request.use(req => {
  console.log("Headers with multipart explicitly set:", req.headers.get('Content-Type'));
  return req;
});

const FormData = require('form-data');
const fd = new FormData();
fd.append('file', 'some text');

api.post('http://localhost:8000', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(e => {});

const api2 = axios.create({ headers: { "Content-Type": "application/json" } });
api2.interceptors.request.use(req => {
  console.log("Headers without explicit override:", req.headers.get('Content-Type'));
  return req;
});
api2.post('http://localhost:8000', fd).catch(e => {});

