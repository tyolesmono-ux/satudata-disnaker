import { GAS_URL, API_SECRET } from '../config/constants';

/**
 * Fetch wrapper with timeout and automatic secret appending
 * @param {string} url - API URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in ms (default: 30000ms / 30s)
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // For POST requests, we append the secret to the body
  if (options.method === 'POST' && options.body) {
    try {
      const bodyObj = JSON.parse(options.body);
      if (!bodyObj.secret && API_SECRET) {
        bodyObj.secret = API_SECRET;
        options.body = JSON.stringify(bodyObj);
      }
    } catch (e) {
      console.warn("Failed to parse fetch body to append secret", e);
    }
  }

  // For GET requests, we append the secret to the URL params
  if ((!options.method || options.method === 'GET') && API_SECRET) {
    url = url.includes('?') ? `${url}&secret=${API_SECRET}` : `${url}?secret=${API_SECRET}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000} seconds. Harap periksa koneksi internet Anda atau coba lagi nanti.`);
    }
    throw error;
  }
};
