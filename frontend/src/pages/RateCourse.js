import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseDetails } from '../api';
import { useRatings } from '../hooks/useRatings';

const RateCourse = () => {
  const { courseId, userId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { submitRating, loading: submitting } = useRatings();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseDetails(courseId);
        setCourse(data);
      } catch (err) {
        setError(`Failed to load course: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitRating(userId, courseId, rating, reviewText);
      alert('Rating submitted successfully!');
      navigate(-1); // Go back to previous page
    } catch (err) {
      setError(`Failed to submit rating: ${err.message}`);
    }
  };

  if (loading) return <div>Loading course details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div>
      <h1>Rate Course</h1>
      <div className="course-details">
        <h2>{course.title}</h2>
        <p>{course.description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rating-input">
          <label>Your Rating (1-5):</label>
          <select 
            value={rating} 
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value="1">1 - Poor</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very Good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </div>

        <div className="review-input">
          <label>Your Review:</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows="4"
            placeholder="Write your review here (optional)"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
};

export default RateCourse;