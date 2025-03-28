// src/components/courses/CourseReviews.js
import React from 'react';
import { useReviews } from '../../hooks/useReviews';

const CourseReviews = ({ courseId }) => {
  const { reviews, loading, error, stats } = useReviews(courseId);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderStars = (rating) => {
    return "★★★★★".substring(0, Math.round(rating)) + 
           "☆☆☆☆☆".substring(0, 5 - Math.round(rating));
  };

  // Calculate review distribution manually
  const calculateDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (reviews && reviews.length > 0) {
      reviews.forEach(review => {
        const rating = Math.round(review.rating);
        if (rating >= 1 && rating <= 5) {
          distribution[rating] += 1;
        }
      });
    }
    
    return distribution;
  };

  if (loading) {
    return <div className="review-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="review-error">Error loading reviews: {error}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews-container">
        <p className="no-reviews-message">No reviews yet. Be the first to review this course!</p>
      </div>
    );
  }

  // Calculate real distribution from reviews
  const distribution = calculateDistribution();
  const totalReviews = reviews.length;

  return (
    <div className="course-reviews">
      <div className="reviews-summary">
        <div className="average-rating">
          <span className="avg-rating-value">{parseFloat(stats.avg_rating).toFixed(1)}</span>
          <div className="avg-rating-stars">{renderStars(parseFloat(stats.avg_rating))}</div>
          <span className="total-reviews">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="rating-bar-container">
              <span className="star-label">{star} star{star !== 1 ? 's' : ''}</span>
              <div className="rating-bar-wrapper">
                <div 
                  className="rating-bar" 
                  style={{ 
                    width: `${totalReviews > 0 
                      ? (distribution[star] / totalReviews) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <span className="count-label">
                {distribution[star]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <span className="reviewer-name">{review.username}</span>
                <span className="review-date">{formatDate(review.created_at)}</span>
              </div>
              <div className="review-rating">
                <span className="rating-stars">{renderStars(review.rating)}</span>
                <span className="rating-value">{review.rating}.0</span>
              </div>
            </div>
            
            {review.description && (
              <div className="review-content">
                <p className="review-text">{review.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseReviews;