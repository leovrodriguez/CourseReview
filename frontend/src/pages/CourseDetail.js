// src/pages/CourseDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseDetails } from '../api/courses';
import { useReviews } from '../hooks/useReviews';
import CourseReviews from '../components/courses/CourseReviews';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { reviews, stats, loading: reviewsLoading } = useReviews(courseId);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const data = await getCourseDetails(courseId);
        setCourse(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching course details');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const renderStars = (rating) => {
    return "★★★★★".substring(0, Math.round(rating)) + 
           "☆☆☆☆☆".substring(0, 5 - Math.round(rating));
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={handleBackClick} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="error-container">
        <div className="error-message">Course not found</div>
        <button onClick={handleBackClick} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <button onClick={handleBackClick} className="back-button">
        ← Back to Courses
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
                  <span className="rating-value">{parseFloat(course.rating).toFixed(1)}</span>
                  <span className="rating-stars">{renderStars(parseFloat(course.rating))}</span>
                  <span className="rating-count">({course.num_ratings.toLocaleString()} ratings)</span>
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
            <p className="course-detail-description">{course.description}</p>
          </div>
          
          <div className="course-instructors-section">
            <h2>Instructor{course.authors?.length > 1 ? 's' : ''}</h2>
            <p className="course-detail-instructors">{course.authors?.join(', ')}</p>
          </div>
          
          <div className="course-skills-section">
            <h2>Skills You'll Learn</h2>
            <ul className="course-detail-skills">
              {course.skills?.map((skill, index) => (
                <li key={index} className="skill-item">{skill}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="course-reviews-section">
          <h2>User Reviews</h2>
          <CourseReviews courseId={courseId} />
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;