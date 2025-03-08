import { API_BASE_URL } from './config';

export const rateCourse = async (userId, courseId, rating, reviewText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,       // Changed from userId
        course_id: courseId,   // Changed from courseId
        rating: rating,
        description: reviewText // Changed from reviewText
      }),
    });
    if (!response.ok) {
      throw new Error(`Error rating course: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error rating course:', error);
    throw error;
  }
};

export const getCourseRatings = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/ratings`);
    if (!response.ok) {
      throw new Error(`Error fetching course ratings: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching course ratings:', error);
    throw error;
  }
};

export const getCourseReviews = async (courseId, limit, offset) => {
  try {
    const url = new URL(`${API_BASE_URL}/course/${courseId}/reviews`);
    
    // Add pagination parameters if provided
    if (limit !== undefined) url.searchParams.append('limit', limit);
    if (offset !== undefined) url.searchParams.append('offset', offset);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty stats if no reviews found
        return {
          reviews: [],
          stats: {
            review_count: 0,
            avg_rating: 0,
            min_rating: 0,
            max_rating: 0
          }
        };
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    // Return default values on error instead of throwing
    return {
      reviews: [],
      stats: {
        review_count: 0,
        avg_rating: 0,
        min_rating: 0,
        max_rating: 0
      }
    };
  }
};