// src/components/courses/CourseReviews.js
import React from 'react';
import { useReviews } from '../../hooks/useReviews';

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={
          index < fullStars 
            ? "star-full" 
            : (index === fullStars && hasHalfStar) 
              ? "star-half" 
              : "star-empty"
        }>
          {index < fullStars 
            ? "★" 
            : (index === fullStars && hasHalfStar) 
              ? "★" 
              : "☆"}
        </span>
      ))}
    </div>
  );
};

const CourseReviews = ({ courseId }) => {
  const { 
    reviews, 
    stats, 
    loading, 
    error, 
    loadMore, 
    hasMore 
  } = useReviews(courseId);

  if (loading && reviews.length === 0) {
    return <div className="loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="error-message">Error loading reviews: {error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="no-reviews">No reviews yet for this course.</div>;
  }

  return (
    <div className="course-reviews-container">
      <div className="reviews-summary">
        <h3>Student Reviews</h3>
        <div className="reviews-stats">
          <div className="avg-rating">
            <span className="rating-number">{stats.avg_rating}</span>
            <StarRating rating={stats.avg_rating} />
            <span className="review-count">({stats.review_count} reviews)</span>
          </div>
        </div>
      </div>
      
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <span className="reviewer-name">{review.username || 'Anonymous User'}</span>
              </div>
              <div className="review-rating">
                <StarRating rating={review.rating} />
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {review.description && (
              <div className="review-content">
                <p>{review.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more-container">
          <button onClick={loadMore} className="load-more-button">
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseReviews;