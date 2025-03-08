// src/api/courses.js
import { API_BASE_URL } from './config';

export const fetchAllCourses = async (limit = 12, offset = 0) => {
  try {
    const url = new URL(`${API_BASE_URL}/course`);
    
    // Add pagination parameters
    if (limit) url.searchParams.append('limit', limit);
    if (offset) url.searchParams.append('offset', offset);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching courses: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const searchCourses = async (query, limit = 12) => {
  try {
    if (!query || query.trim() === '') {
      // If query is empty, fall back to regular fetch
      return fetchAllCourses(limit);
    }

    const response = await fetch(`${API_BASE_URL}/course/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        limit: limit
      }),
    });

    if (!response.ok) {
      throw new Error(`Error searching courses: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the courses to match the expected structure
    const transformedCourses = (data.courses || []).map(course => {
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        platform: course.platform,
        authors: course.authors,
        skills: course.skills,
        image_url: course.image_url,
        is_free: course.is_free,
        url: course.url,
        // Map the fields that have different names
        rating: course.original_website_rating || 0,
        num_ratings: course.original_website_num_ratings || 0
      };
    });
    
    return transformedCourses;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
};

export const getCourseDetails = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching course details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching course details:', error);
    throw error;
  }
};