// src/api/discussions.js
import { API_BASE_URL } from './config';

/**
 * Fetch discussions for a specific course
 * @param {string} courseId - The ID of the course
 * @param {number} limit - Optional limit for pagination
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Object>} - Promise resolving to discussions data
 */
export const getCourseDiscussions = async (courseId, limit, offset) => {
  try {
    let url = `${API_BASE_URL}/course/${courseId}/discussions`;
    
    // Add pagination parameters if provided
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit);
    if (offset !== undefined) params.append('offset', offset);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discussions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching discussions:', error);
    throw error;
  }
};

/**
 * Create a new discussion
 * @param {string} title - The discussion title
 * @param {string} description - The discussion content
 * @param {Array} courseIds - Array of course IDs referenced in the discussion
 * @returns {Promise<Object>} - Promise resolving to the creation response
 */
export const createDiscussion = async (title, description, courseIds = []) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to create a discussion');
    }
    
    const response = await fetch(`${API_BASE_URL}/course/discussion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        course_ids: courseIds
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create discussion');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating discussion:', error);
    throw error;
  }
};

/**
 * Search for courses to reference in discussions
 * @param {string} query - The search query for courses
 * @param {number} limit - Optional limit for results
 * @returns {Promise<Object>} - Promise resolving to search results
 */
export const searchCoursesForReference = async (query, limit = 5) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/course/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        query,
        limit
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to search courses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
};

// src/api/discussions.js

/**
 * Fetch all recent discussions
 * @param {number} limit - Optional limit for pagination
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Object>} - Promise resolving to discussions data
 */
export const getAllDiscussions = async (limit, offset) => {
  try {
    let url = `${API_BASE_URL}/course/discussions`;
    
    // Add pagination parameters if provided
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit);
    if (offset !== undefined) params.append('offset', offset);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch discussions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching discussions:', error);
    throw error;
  }
};