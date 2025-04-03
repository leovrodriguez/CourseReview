// src/pages/CourseDetail.js - Updated with Discussions Tab
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseDetails, submitCourseReview } from '../api/courses';
import { useReviews } from '../hooks/useReviews';
import CourseReviews from '../components/courses/CourseReviews';
import CourseDiscussions from '../components/courses/CourseDiscussions';
import { API_BASE_URL } from '../api/config';

const CourseDetail = () => {
  // Get the course ID from URL params
  const { courseId } = useParams();
  console.log('Route params courseId:', courseId);
  
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { reviews, stats, loading: reviewsLoading, refreshReviews } = useReviews(courseId);
  
  // User state
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('reviews');
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Error popup state
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState('');
  
  // Check if user is logged in and get user ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token && userString) {
      try {
        const userData = JSON.parse(userString);
        setUserId(userData.id);
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  
  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        setLoading(false);
        setError('No course ID provided');
        console.error('No course ID provided in URL parameters');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching course details, courseId:', courseId);
        const data = await getCourseDetails(courseId);
        console.log('Received course data:', data);
        
        if (!data) {
          throw new Error('No course data received');
        }
        
        setCourse(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(err.message || 'Error fetching course details');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const renderStars = (rating) => {
    return "★★★★★".substring(0, Math.round(rating)) + 
           "☆☆☆☆☆".substring(0, 5 - Math.round(rating));
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleReviewChange = (e) => {
    setReview(e.target.value);
  };

  const toggleReviewForm = () => {
    if (!isLoggedIn) {
      // Redirect to login if not logged in
      setSubmitError('You must be logged in to submit a review');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    setShowReviewForm(!showReviewForm);
    // Reset form state when opening
    if (!showReviewForm) {
      setRating(0);
      setReview('');
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    setErrorPopupMessage('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn || !userId) {
      setSubmitError('You must be logged in to submit a review');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      
      console.log('Submitting review with userId:', userId);
      
      try {
        // Try to use the API function first
        await submitCourseReview(userId, courseId, rating, review.trim() || null);
        
        // Show success message
        setSubmitSuccess(true);
        
        // Clear form
        setRating(0);
        setReview('');
        
        // Refresh reviews list
        refreshReviews();
        
        // Close form after a delay
        setTimeout(() => {
          setShowReviewForm(false);
          setSubmitSuccess(false);
        }, 2000);
      } catch (error) {
        console.error('Error submitting review:', error);
        
        // Check if the error message indicates the user has already reviewed this course
        if (error.message && error.message.includes('already reviewed')) {
          // Show error popup for duplicate review
          setErrorPopupMessage('You have already reviewed this course. You can only submit one review per course.');
          setShowErrorPopup(true);
          
          // Close the form after a delay
          setTimeout(() => {
            setShowReviewForm(false);
          }, 1000);
        } else {
          // Show general error message for other errors
          setSubmitError(error.message || 'Failed to submit review');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    console.log('CourseDetail is in loading state');
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    console.log('CourseDetail has error:', error);
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
        <div>Course ID: {courseId || 'Not provided'}</div>
        <button onClick={handleBackClick} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!course) {
    console.log('CourseDetail has no course data');
    return (
      <div className="error-container">
        <div className="error-message">Course not found</div>
        <div>Course ID: {courseId || 'Not provided'}</div>
        <button onClick={handleBackClick} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  console.log('CourseDetail rendering with course:', course);

  return (
    <div className="course-detail-page">
      {/* Error Popup Modal */}
      {showErrorPopup && (
        <div className="error-popup-overlay">
          <div className="error-popup-content">
            <h3>Already Reviewed</h3>
            <p>{errorPopupMessage}</p>
            <button onClick={closeErrorPopup} className="close-error-button">
              OK
            </button>
          </div>
        </div>
      )}
      
      <button onClick={handleBackClick} className="back-button">
        Back to Courses
      </button>
      
      <div className="course-detail-container">
        <div className="course-detail-header">
          <div className="course-image-container">
            <img src={course.image_url} alt={course.title} className="course-detail-image" />
          </div>
          
          <div className="course-detail-info">
            <h1 className="course-detail-title">{course.title}</h1>
            <p className="course-detail-platform">{course.platform}</p>
            
            <div className="course-detail-ratings">
              <div className="provider-ratings-container">
                <h3>Provider Ratings</h3>
                <div className="rating-display">
                  <span className="rating-value">{parseFloat(course.rating || 0).toFixed(1)}</span>
                  <span className="rating-stars">{renderStars(parseFloat(course.rating || 0))}</span>
                  <span className="rating-count">({(course.num_ratings || 0).toLocaleString()} ratings)</span>
                </div>
              </div>
              
              <div className="internal-ratings-container">
                <h3>RateMyCourse Ratings</h3>
                <div className="rating-display">
                  {reviewsLoading ? (
                    <span className="loading-ratings">Loading...</span>
                  ) : stats.review_count > 0 ? (
                    <>
                      <span className="rating-value">{parseFloat(stats.avg_rating).toFixed(1)}</span>
                      <span className="rating-stars">{renderStars(parseFloat(stats.avg_rating))}</span>
                      <span className="rating-count">({stats.review_count} ratings)</span>
                    </>
                  ) : (
                    <span className="no-ratings">No ratings yet</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="course-price-container">
              {course.is_free ? (
                <span className="price-free detail-price">Free</span>
              ) : (
                <span className="price-paid detail-price">Paid</span>
              )}
            </div>
            
            <a 
              href={course.url} 
              target="_blank"
              rel="noopener noreferrer"
              className="course-detail-link"
            >
              Visit Provider Site
              <svg className="external-link-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="course-detail-sections">
          <div className="course-description-section">
            <h2>Course Description</h2>
            <p className="course-detail-description">{course.description || 'No description available'}</p>
          </div>
          
          <div className="course-instructors-section">
            <h2>Instructor{course.authors?.length > 1 ? 's' : ''}</h2>
            <p className="course-detail-instructors">
              {course.authors && course.authors.length > 0 
                ? course.authors.join(', ') 
                : 'No instructor information available'}
            </p>
          </div>
          
          <div className="course-skills-section">
            <h2>Skills You'll Learn</h2>
            {course.skills && course.skills.length > 0 ? (
              <ul className="course-detail-skills">
                {course.skills.map((skill, index) => (
                  <li key={index} className="skill-item">{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No skills information available</p>
            )}
          </div>
        </div>
        
        <div className="course-tabs-section">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => handleTabChange('reviews')}
            >
              User Reviews
            </button>
            <button 
              className={`tab-button ${activeTab === 'discussions' ? 'active' : ''}`}
              onClick={() => handleTabChange('discussions')}
            >
              Discussions
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <div className="reviews-header">
                  <h2>User Reviews</h2>
                  <button className="post-review-button" onClick={toggleReviewForm}>
                    {showReviewForm ? 'Cancel' : 'Post a Review'}
                  </button>
                </div>
                
                {showReviewForm && (
                  <div className="review-form-container">
                    <form onSubmit={handleSubmitReview} className="review-form">
                      <h3>Write a Review</h3>
                      
                      {submitError && (
                        <div className="review-submit-error">{submitError}</div>
                      )}
                      
                      {submitSuccess && (
                        <div className="review-submit-success">Review submitted successfully!</div>
                      )}
                      
                      <div className="rating-input-container">
                        <label>Rating:</label>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-button ${star <= rating ? 'selected' : ''}`}
                              onClick={() => handleRatingChange(star)}
                            >
                              {star <= rating ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="review-text-container">
                        <label htmlFor="review-text">Your Review (Optional):</label>
                        <textarea
                          id="review-text"
                          value={review}
                          onChange={handleReviewChange}
                          placeholder="Write your thoughts about this course..."
                          rows={5}
                        ></textarea>
                      </div>
                      
                      <button 
                        type="submit" 
                        className="submit-review-button"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}
                
                <CourseReviews courseId={courseId} />
              </div>
            )}
            
            {activeTab === 'discussions' && (
              <div className="discussions-tab">
                <CourseDiscussions courseId={courseId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;