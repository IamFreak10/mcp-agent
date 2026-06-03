
export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:10000', 
  CONTACTS: '/contacts',
  MEETINGS: '/meetings',
  TASKS: '/tasks',

};

export const getUrl = (endpoint) => `${API_ENDPOINTS.BASE_URL}${endpoint}`;