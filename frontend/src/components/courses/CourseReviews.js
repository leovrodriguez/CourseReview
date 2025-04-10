// src/components/courses/CourseReviews.js
import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config';

const CourseReviews = ({ courseId, reviews, loading, error, stats, refreshReviews }) => {
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

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

  // Check if the current user is the owner of a review
  const isReviewOwner = (review) => {
    if (!review || !review.user_id) return false;
    
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return false;
      
      const userData = JSON.parse(userString);
      return userData.id === review.user_id;
    } catch (err) {
      console.error('Error checking review ownership:', err);
      return false;
    }
  };

  // Request confirmation for deleting a review
  const requestDeleteConfirmation = (review) => {
    setReviewToDelete(review);
    setShowConfirmation(true);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowConfirmation(false);
    setReviewToDelete(null);
  };

  // Confirm and handle deleting a review
  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    
    const reviewId = reviewToDelete.id;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to delete a review');
      }

      const response = await fetch(`${API_BASE_URL}/course/${courseId}/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete review');
      }

      // Refresh the reviews list after deletion
      refreshReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setReviewToDelete(null);
    }
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
      {deleteError && (
        <div className="review-error" style={{ marginBottom: '15px' }}>
          {deleteError}
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && reviewToDelete && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this review? This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button 
                className="cancel-button" 
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                
                {/* Show trash icon button for user's own reviews */}
                {isReviewOwner(review) && (
                  <button 
                    className="trash-icon-button" 
                    onClick={() => requestDeleteConfirmation(review)}
                    disabled={deleteLoading}
                    aria-label="Delete review"
                    title="Delete review"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
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