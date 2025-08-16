import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- ADD THIS NEW INTERCEPTOR ---
// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response, // On success, just return the response
  async (error) => {
    const originalRequest = error.config;
    // If the error is 401 and it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // If no refresh token, logout the user
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Call the refresh token endpoint
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        
        // Store the new access token and refresh token
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        
        // Update the authorization header for the original request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        
        // Retry the original request
        return apiClient(originalRequest);

      } catch (refreshError) {
        // If refresh fails, logout the user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
// --- END NEW INTERCEPTOR ---

export default apiClient;