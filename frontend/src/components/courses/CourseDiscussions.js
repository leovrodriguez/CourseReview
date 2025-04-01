import React, { useState, useEffect } from 'react';
import CourseSelector from './CourseSelector';
import { API_BASE_URL } from '../../api/config';
import useDiscussions from '../../hooks/useDiscussions';

const CourseDiscussions = ({ courseId }) => {
  const { discussions, loading, error, refreshDiscussions } = useDiscussions(courseId);
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'

  // State for course selection modal
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [referencedCourses, setReferencedCourses] = useState([]);
  const [loadedCourseDetails, setLoadedCourseDetails] = useState({});

  // Fetch course details for referenced courses
  // Fetch course details for referenced courses
useEffect(() => {
  const fetchCourseDetails = async () => {
    if (referencedCourses.length === 0) return;

    try {
      const courseDetailsPromises = referencedCourses.map(async (course) => {
        try {
          const response = await fetch(`${API_BASE_URL}/course/${course.id}`);
          if (!response.ok) {
            console.warn(`Failed to fetch details for course ${course.id}`);
            return { [course.id]: course };
          }
          const courseDetails = await response.json();
          return { [course.id]: { 
            ...courseDetails, 
            title: courseDetails.title || course.title,
            platform: courseDetails.platform || course.platform
          }};
        } catch (error) {
          console.error(`Error fetching details for course ${course.id}:`, error);
          return { [course.id]: course };
        }
      });

      const courseDetailsResults = await Promise.all(courseDetailsPromises);
      const detailsMap = courseDetailsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      
      setLoadedCourseDetails(prev => ({ ...prev, ...detailsMap }));
    } catch (error) {
      console.error('Error in course details fetching:', error);
    }
  };

  fetchCourseDetails();
}, [referencedCourses]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const toggleNewDiscussionForm = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
      setSubmitError('You must be logged in to start a discussion');
      return;
    }

    setShowNewDiscussionForm(!showNewDiscussionForm);
    // Reset form state when opening
    if (!showNewDiscussionForm) {
      setTitle('');
      setDescription('');
      setSubmitError(null);
      setSubmitSuccess(false);
      setActiveTab('write');
      setReferencedCourses([]);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const addCourseReference = () => {
    // Open course selector modal
    setShowCourseSelector(true);
  };

  const handleCourseSelected = (course) => {
    // Add course to referenced courses and insert its reference in the description
    const courseToken = `***[[course:${course.id}]]***`;

    // Add to referenced courses if not already added
    const isAlreadyReferenced = referencedCourses.some(c => c.id === course.id);
    if (!isAlreadyReferenced) {
      setReferencedCourses(prev => [...prev, course]);
    }

    // Get textarea element
    const textarea = document.getElementById('discussion-description');

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert the token at cursor position
      const updatedDescription =
        description.substring(0, start) +
        courseToken +
        description.substring(end);

      setDescription(updatedDescription);

      // Focus back on textarea after inserting
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + courseToken.length;
        textarea.selectionEnd = start + courseToken.length;
      }, 0);
    } else {
      // If textarea not found, just append to the end
      setDescription(description + ' ' + courseToken);
    }

    // Close the course selector
    setShowCourseSelector(false);
  };

  const removeReferencedCourse = (courseId) => {
    // Remove course reference from referencedCourses
    setReferencedCourses(prev => prev.filter(c => c.id !== courseId));

    // Remove course token from description
    const courseToken = `***[[course:${courseId}]]***`;
    const updatedDescription = description.replace(courseToken, '').trim();
    setDescription(updatedDescription);
  };

  const parseDescription = (text, discussionMode = false) => {
    if (!text) return '';
  
    // This is a preview/display renderer
    const parts = text.split(/(\*\*\*\[\[course:[a-f0-9-]+\]\]\*\*\*)/g);
  
    return parts.map((part, index) => {
      const courseMatch = part.match(/\*\*\*\[\[course:([a-f0-9-]+)\]\]\*\*\*/);
      if (courseMatch) {
        const courseId = courseMatch[1];
  
        // Determine course details
        let courseDetails = loadedCourseDetails[courseId] || 
          referencedCourses.find(c => c.id === courseId);
  
        // If no course details found, fallback to minimal representation
        if (!courseDetails) {
          courseDetails = {
            id: courseId,
            title: `Course Reference (ID: ${courseId.substring(0, 8)}...)`,
            platform: ''
          };
        }
  
        // Prepare display text
        const courseTitle = courseDetails.title || 'Course Reference';
        const displayText = discussionMode
          ? courseTitle
          : `${courseTitle} ${courseDetails.platform ? `(${courseDetails.platform})` : ''}`;
  
        return (
          React.createElement(
            'a',
            {
              key: index,
              href: `/course/${courseId}`,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'course-reference'
            },
            React.createElement(
              'span', 
              { className: 'course-reference-icon' }, 
              '📚'
            ),
            React.createElement(
              'span', 
              { className: 'course-reference-title' }, 
              displayText
            )
          )
        );
      }
      return React.createElement('span', { key: index }, part);
    });
  };

  const handleSubmitDiscussion = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
      setSubmitError('You must be logged in to start a discussion');
      return;
    }

    // Validate input
    if (!title.trim()) {
      setSubmitError('Please enter a title for your discussion');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Please enter a description for your discussion');
      return;
    }

    const userData = JSON.parse(userString);
    const userId = userData.id;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          referenced_courses: referencedCourses.map(c => c.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create discussion');
      }

      // Show success message
      setSubmitSuccess(true);

      // Clear form
      setTitle('');
      setDescription('');
      setReferencedCourses([]);

      // Refresh discussions list
      refreshDiscussions();

      // Close form after a delay
      setTimeout(() => {
        setShowNewDiscussionForm(false);
        setSubmitSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error creating discussion:', err);
      setSubmitError(err.message || 'Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && (!discussions || discussions.length === 0)) {
    return <div className="discussion-loading">Loading discussions...</div>;
  }

  if (error) {
    return <div className="discussion-error">Error loading discussions: {error}</div>;
  }

  return (
    <div className="course-discussions">
      <div className="discussions-header">
        <h2>Course Discussions</h2>
        <button className="post-discussion-button" onClick={toggleNewDiscussionForm}>
          {showNewDiscussionForm ? 'Cancel' : 'Start a Discussion'}
        </button>
      </div>

      {showNewDiscussionForm && (
        <div className="discussion-form-container">
          <form onSubmit={handleSubmitDiscussion} className="discussion-form">
            <h3>Create a New Discussion</h3>

            {submitError && (
              <div className="discussion-submit-error">{submitError}</div>
            )}

            {submitSuccess && (
              <div className="discussion-submit-success">Discussion created successfully!</div>
            )}

            <div className="discussion-title-container">
              <label htmlFor="discussion-title">Title:</label>
              <input
                id="discussion-title"
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter a title for your discussion"
                maxLength={100}
              />
            </div>

            {/* Referenced Courses Display */}
            {referencedCourses.length > 0 && (
              <div className="referenced-courses-container">
                {referencedCourses.map((course) => (
                  <div key={course.id} className="referenced-course-chip">
                    <span>{course.title}</span>
                    <button
                      type="button"
                      onClick={() => removeReferencedCourse(course.id)}
                      className="remove-referenced-course-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="discussion-tabs">
              <button
                type="button"
                className={`tab-button ${activeTab === 'write' ? 'active' : ''}`}
                onClick={() => handleTabChange('write')}
              >
                Write
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => handleTabChange('preview')}
              >
                Preview
              </button>
            </div>

            {activeTab === 'write' ? (
              <div className="discussion-text-container">
                <div className="discussion-toolbar">
                  <button
                    type="button"
                    className="add-course-button"
                    onClick={addCourseReference}
                  >
                    Add Course Reference
                  </button>
                </div>
                <textarea
                  id="discussion-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Write your discussion here. You can add course references by clicking the 'Add Course Reference' button."
                  rows={8}
                ></textarea>
                <div className="description-help">
                  <p>Course references will appear as <code>***[[course:UUID]]***</code> in write mode but will be displayed nicely in preview mode.</p>
                </div>
              </div>
            ) : (
              <div className="discussion-preview-container">
                <h4>{title || 'Discussion Title Preview'}</h4>
                <div className="discussion-preview-content">
                  {description ? (
                    parseDescription(description)
                  ) : (
                    <em>Your discussion preview will appear here...</em>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="submit-discussion-button"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Post Discussion'}
            </button>
          </form>
        </div>
      )}

      {/* Course Selection Modal */}
      {showCourseSelector && (
        <CourseSelector
          onSelect={handleCourseSelected}
          onCancel={() => setShowCourseSelector(false)}
        />
      )}

      {!discussions || discussions.length === 0 ? (
        <div className="no-discussions">
          <p>No discussions yet. Start a new discussion to be the first!</p>
        </div>
      ) : (
        <div className="discussions-list">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="discussion-item">
              <div className="discussion-header">
                <h3 className="discussion-title">{discussion.title}</h3>
                <div className="discussion-meta">
                  <span className="discussion-author">{discussion.username || 'Anonymous'}</span>
                  <span className="discussion-date">{formatDate(discussion.created_at)}</span>
                </div>
              </div>
              <div className="discussion-content">
                <p>{parseDescription(discussion.description, true)}</p>
              </div>
              <div className="discussion-actions">
                <button className="reply-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseDiscussions;