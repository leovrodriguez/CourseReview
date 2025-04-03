import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseReviews } from '../../api/courses';

const CourseCard = ({ course }) => {
  const [internalRatings, setInternalRatings] = useState({
    avg_rating: 0,
    review_count: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInternalRatings = async () => {
      try {
        if (course.id) {
          const result = await getCourseReviews(course.id);
          if (result && result.stats) {
            setInternalRatings(result.stats);
          }
        }
      } catch (error) {
        console.error("Error fetching internal ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternalRatings();
  }, [course.id]);

  const renderStars = (rating) => {
    const ratingValue = parseFloat(rating) || 0;
    return "★★★★★".substring(0, Math.round(ratingValue)) + 
           "☆☆☆☆☆".substring(0, 5 - Math.round(ratingValue));
  };

  const handleCardClick = (e) => {
    // Prevent navigation when clicking on the external link button
    if (e.target.closest('.course-link') || e.target.closest('.external-link-icon')) {
      return;
    }
    
    // Navigate to course detail page
    navigate(`/course/${course.id}`);
  };

  // Safe values with fallbacks
  const rating = course.rating || 0;
  const numRatings = course.num_ratings || 0;
  const description = course.description || 'No description available';

  return (
    <div className="course-card" onClick={handleCardClick}>
      <div className="course-header">
        <img 
          src={course.image_url} 
          alt={course.title} 
          className="course-image" 
        />
      </div>
      
      <div className="course-content">
        <h3 className="course-title">{course.title}</h3>
        <p className="course-platform">{course.platform}</p>
        
        <div className="ratings-container">
          {/* Provider ratings */}
          <div className="course-ratings provider-ratings">
            <div className="ratings-header">Provider Ratings</div>
            <span className="rating-value">{parseFloat(rating).toFixed(1)}</span>
            <span className="rating-stars">{renderStars(rating)}</span>
            <span className="rating-count">({numRatings.toLocaleString()} ratings)</span>
          </div>
          
          {/* Internal platform ratings */}
          <div className="course-ratings internal-ratings">
            <div className="ratings-header">RateMyCourse Ratings</div>
            {loading ? (
              <span className="loading-ratings">Loading...</span>
            ) : internalRatings.review_count > 0 ? (
              <>
                <span className="rating-value">{parseFloat(internalRatings.avg_rating).toFixed(1)}</span>
                <span className="rating-stars">{renderStars(internalRatings.avg_rating)}</span>
                <span className="rating-count">({internalRatings.review_count.toLocaleString()} ratings)</span>
              </>
            ) : (
              <span className="no-ratings">No ratings yet</span>
            )}
          </div>
        </div>
        
        <div className="course-price">
          {course.is_free ? (
            <span className="price-free">Free</span>
          ) : (
            <span className="price-paid">Paid</span>
          )}
        </div>
        
        <p className="course-description">{description.substring(0, 150)}...</p>
        
        <a 
          href={course.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="course-link"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking the link
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
  );
};

export default CourseCard;