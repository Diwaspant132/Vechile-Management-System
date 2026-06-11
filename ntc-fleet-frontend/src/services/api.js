const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

const createUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message || response.statusText || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const request = async (path, options = {}) => {
  const { method = 'GET', headers = {}, body, token, ...rest } = options;

  const mergedHeaders = {
    ...defaultHeaders,
    ...headers
  };

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const requestOptions = {
    method,
    headers: mergedHeaders,
    ...rest
  };

  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(createUrl(path), requestOptions);
  return handleResponse(response);
};

export const get = (path, options = {}) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options = {}) => request(path, { ...options, method: 'POST', body });
export const put = (path, body, options = {}) => request(path, { ...options, method: 'PUT', body });
export const del = (path, options = {}) => request(path, { ...options, method: 'DELETE' });

export default {
  request,
  get,
  post,
  put,
  del
};
