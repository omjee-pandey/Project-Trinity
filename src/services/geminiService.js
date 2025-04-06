import axios from 'axios';

// Create axios instance with robust configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});

// Comprehensive error handling
export const generateContent = async (prompt) => {
  try {
    // Validate prompt
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }

    // Detailed logging
    console.log('Sending Prompt:', prompt);

    // Make API call with full error details
    const response = await api.post('/generate', { prompt }, {
      // Additional axios config if needed
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Default
      }
    });

    // Validate and log response
    console.log('Full Response:', response);

    // Check for successful response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Unknown error occurred');
    }

    return response.data.response;

  } catch (error) {
    // Comprehensive error logging
    console.error('Content Generation Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      config: error.config
    });

    // Detailed error handling
    if (error.response) {
      // Server responded with an error status
      console.error('Server Response Error:', error.response.data);
      throw new Error(error.response.data.message || 'Server error occurred');
    } else if (error.request) {
      // Request made but no response received
      console.error('No Response Received:', error.request);
      throw new Error('No response from server. Check network connection.');
    } else {
      // Error setting up the request
      console.error('Request Setup Error:', error.message);
      throw error;
    }
  }
};