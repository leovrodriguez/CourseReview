import React, { useState, useEffect } from 'react';
import CourseSelector from './CourseSelector';
import { API_BASE_URL } from '../../api/config';
import useDiscussions from '../../hooks/useDiscussions';

// New component for threaded replies
const Reply = ({ reply, courseId, discussionId, depth = 0, onReplyAdded, originalPosterId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [childReplies, setChildReplies] = useState(reply.child_replies || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOriginalPoster = reply.user_id === originalPosterId;
  const isDeleted = reply.text === '[deleted]';

  // Get the current user to determine if they can delete the reply
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const canDelete = currentUser && reply.user_id === currentUser.id && !isDeleted;

  const handleReplyClick = () => {
    setShowReplyForm(!showReplyForm);
  };

  const handleReplyChange = (e) => {
    setReplyText(e.target.value);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
      alert('You must be logged in to reply');
      return;
    }

    // Validate input
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    const userData = JSON.parse(userString);
    const userId = userData.id;

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion/${discussionId}/reply/${reply.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          text: replyText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reply');
      }

      const result = await response.json();

      // Create a temporary reply object
      const newReply = {
        id: result.reply_id,
        text: replyText.trim(),
        user_id: userId,
        username: userData.username || 'You',
        created_at: new Date().toISOString(),
        child_replies: []
      };

      // Add to child replies
      setChildReplies(prev => [...prev, newReply]);

      // Clear form
      setReplyText('');
      setShowReplyForm(false);

      // Notify parent component
      if (onReplyAdded) {
        onReplyAdded();
      }

    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Error submitting reply: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle delete button click
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Function to cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Function to confirm and process delete
  const handleConfirmDelete = async () => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
      alert('You must be logged in to delete a reply');
      setShowDeleteConfirm(false);
      return;
    }

    const userData = JSON.parse(userString);
    const userId = userData.id;

    try {
      setIsDeleting(true);

      const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion/${discussionId}/reply/${reply.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reply');
      }

      // Update the reply text locally to show as deleted
      reply.text = '[deleted]';
      reply.username = 'Anonymous';

      // Hide delete confirmation
      setShowDeleteConfirm(false);

      // Notify parent component to refresh
      if (onReplyAdded) {
        onReplyAdded();
      }

    } catch (err) {
      console.error('Error deleting reply:', err);
      alert('Error deleting reply: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`reply-thread ${childReplies.length > 0 ? 'has-children' : ''}`}>
      <div className={`reply-item ${isDeleted ? 'deleted' : ''}`}>
        <div className="reply-meta">
          <span className={`reply-author ${isOriginalPoster && !isDeleted ? 'is-op' : ''}`}>
            {reply.username || 'Anonymous'}
            {isOriginalPoster && !isDeleted && <span className="op-tag">OP</span>}
          </span>
          <span className="reply-date">{formatDate(reply.created_at)}</span>
        </div>
        <div className="reply-text">
          {reply.text}
        </div>
        <div className="reply-actions">
          {!isDeleted && (
            <button
              className="icon-button reply-icon-button"
              onClick={handleReplyClick}
              aria-label="Reply"
              title="Reply"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              Reply
            </button>
          )}
          {canDelete && (
            <button
              className="icon-button delete-icon-button"
              onClick={handleDeleteClick}
              aria-label="Delete reply"
              title="Delete reply"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          )}
        </div>

        {showReplyForm && (
          <div className="nested-reply-form">
            <form onSubmit={handleSubmitReply}>
              <textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={handleReplyChange}
                rows={2}
              ></textarea>
              <div className="reply-form-actions">
                <button
                  type="button"
                  className="cancel-reply-button"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-nested-reply-button"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Reply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="delete-confirmation">
            <p>Are you sure you want to delete this reply?</p>
            <div className="delete-confirmation-buttons">
              <button
                className="cancel-delete-button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render child replies */}
      {childReplies.length > 0 && (
        <div className="child-replies">
          {childReplies.map(childReply => (
            <Reply
              key={childReply.id}
              reply={childReply}
              courseId={courseId}
              discussionId={discussionId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              originalPosterId={originalPosterId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

  // State for viewing a specific discussion
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

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
            return {
              [course.id]: {
                ...courseDetails,
                title: courseDetails.title || course.title,
                platform: courseDetails.platform || course.platform
              }
            };
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

  // Function to extract course IDs from discussion descriptions
  const extractCourseIds = (discussions) => {
    if (!discussions || discussions.length === 0) return [];

    const courseIds = new Set();

    discussions.forEach(discussion => {
      if (discussion.description) {
        // Use regex to find all course references
        const matches = discussion.description.match(/\*\*\*\[\[course:([a-f0-9-]+)\]\]\*\*\*/g);
        if (matches) {
          matches.forEach(match => {
            const courseId = match.match(/\*\*\*\[\[course:([a-f0-9-]+)\]\]\*\*\*/)[1];
            courseIds.add(courseId);
          });
        }
      }
    });

    return Array.from(courseIds);
  };

  // Add this useEffect to load course details for discussions
  useEffect(() => {
    if (!discussions || discussions.length === 0) return;

    const fetchDiscussionCourseDetails = async () => {
      const courseIds = extractCourseIds(discussions);
      if (courseIds.length === 0) return;

      try {
        const courseDetailsPromises = courseIds.map(async (courseId) => {
          // Skip if we already have details for this course
          if (loadedCourseDetails[courseId]) return { [courseId]: loadedCourseDetails[courseId] };

          try {
            const response = await fetch(`${API_BASE_URL}/course/${courseId}`);
            if (!response.ok) {
              console.warn(`Failed to fetch details for course ${courseId}`);
              return { [courseId]: { id: courseId, title: `Course Reference (ID: ${courseId.substring(0, 8)}...)`, platform: '' } };
            }
            const courseDetails = await response.json();
            return { [courseId]: courseDetails };
          } catch (error) {
            console.error(`Error fetching details for course ${courseId}:`, error);
            return { [courseId]: { id: courseId, title: `Course Reference (ID: ${courseId.substring(0, 8)}...)`, platform: '' } };
          }
        });

        const courseDetailsResults = await Promise.all(courseDetailsPromises);
        const detailsMap = courseDetailsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});

        setLoadedCourseDetails(prev => ({ ...prev, ...detailsMap }));
      } catch (error) {
        console.error('Error in discussion course details fetching:', error);
      }
    };

    fetchDiscussionCourseDetails();
  }, [discussions]);

  // Modified: Fetch replies with nested structure when a discussion is selected
  useEffect(() => {
    if (!selectedDiscussion || !courseId) return;

    const fetchReplies = async () => {
      setLoadingReplies(true);
      try {
        const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion/${selectedDiscussion.id}/replies`);
        if (!response.ok) {
          throw new Error('Failed to fetch replies');
        }

        const result = await response.json();

        // Process replies to create a threaded structure
        const topLevelReplies = [];
        const replyMap = {};

        // First, create a map of all replies
        (result.replies || []).forEach(reply => {
          replyMap[reply.id] = {
            ...reply,
            child_replies: []
          };
        });

        // Then, build the hierarchy
        (result.replies || []).forEach(reply => {
          if (reply.parent_reply_id) {
            // This is a child reply
            if (replyMap[reply.parent_reply_id]) {
              replyMap[reply.parent_reply_id].child_replies.push(replyMap[reply.id]);
            } else {
              // Fallback if parent doesn't exist
              topLevelReplies.push(replyMap[reply.id]);
            }
          } else {
            // This is a top-level reply
            topLevelReplies.push(replyMap[reply.id]);
          }
        });

        setReplies(topLevelReplies);
      } catch (error) {
        console.error('Error fetching replies:', error);
      } finally {
        setLoadingReplies(false);
      }
    };

    fetchReplies();
  }, [selectedDiscussion, courseId]);

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

    // Clear selected discussion when showing form
    if (!showNewDiscussionForm) {
      setSelectedDiscussion(null);
    }
  };

  const handleSelectDiscussion = (discussion) => {
    // Close new discussion form if open
    if (showNewDiscussionForm) {
      setShowNewDiscussionForm(false);
    }

    setSelectedDiscussion(discussion);
    setReplyText('');
  };

  const handleBackToDiscussions = () => {
    setSelectedDiscussion(null);
    setReplies([]);
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

          // Log to debug when missing course details
          console.log(`Missing details for course: ${courseId}`);
        }

        // Always show title and platform regardless of discussion mode
        const courseTitle = courseDetails.title || 'Course Reference';
        const displayText = `${courseTitle} ${courseDetails.platform ? `(${courseDetails.platform})` : ''}`;

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
  
    if (!token) {
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
  
    try {
      setSubmitting(true);
      setSubmitError(null);
  
      // Collect all course IDs to include in the payload
      const courseIdsFromRefs = referencedCourses.map(c => c.id);
      
      // Make sure we always include the current course ID from the URL if we're on a course page
      if (courseId && !courseIdsFromRefs.includes(courseId)) {
        courseIdsFromRefs.push(courseId);
      }
      
      // Use the unique set of course IDs
      const allCourseIds = [...new Set(courseIdsFromRefs)];
  
      const response = await fetch(`${API_BASE_URL}/course/discussion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          course_ids: allCourseIds
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
  
  // Add a helper function to extract course IDs from description text
  const extractCourseIdsFromDescription = (text) => {
    if (!text) return [];
    
    const courseIds = [];
    const regex = /\*\*\*\[\[course:([a-f0-9-]+)\]\]\*\*\*/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        courseIds.push(match[1]);
      }
    }
    
    return courseIds;
  };

  const handleReplyChange = (e) => {
    setReplyText(e.target.value);
  };

  // Modified: This now submits a top-level reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
      alert('You must be logged in to reply to a discussion');
      return;
    }

    // Validate input
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    const userData = JSON.parse(userString);
    const userId = userData.id;

    try {
      setSubmittingReply(true);

      const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion/${selectedDiscussion.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          text: replyText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reply');
      }

      const result = await response.json();

      // Create a temporary reply object to add to the UI
      const newReply = {
        id: result.reply_id,
        text: replyText.trim(),
        user_id: userId,
        username: userData.username || 'You',
        created_at: new Date().toISOString(),
        child_replies: []
      };

      // Add to replies list
      setReplies(prev => [...prev, newReply]);

      // Clear form
      setReplyText('');

    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Error submitting reply: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingReply(false);
    }
  };

  // New function to refresh replies after a new reply is added
  const handleReplyAdded = async () => {
    if (!selectedDiscussion || !courseId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/course/${courseId}/discussion/${selectedDiscussion.id}/replies`);
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }

      const result = await response.json();

      // Process replies to create a threaded structure
      const topLevelReplies = [];
      const replyMap = {};

      // First, create a map of all replies
      (result.replies || []).forEach(reply => {
        replyMap[reply.id] = {
          ...reply,
          child_replies: []
        };
      });

      // Then, build the hierarchy
      (result.replies || []).forEach(reply => {
        if (reply.parent_reply_id) {
          // This is a child reply
          if (replyMap[reply.parent_reply_id]) {
            replyMap[reply.parent_reply_id].child_replies.push(replyMap[reply.id]);
          } else {
            // Fallback if parent doesn't exist
            topLevelReplies.push(replyMap[reply.id]);
          }
        } else {
          // This is a top-level reply
          topLevelReplies.push(replyMap[reply.id]);
        }
      });

      setReplies(topLevelReplies);
    } catch (error) {
      console.error('Error refreshing replies:', error);
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
        <h2>
          {selectedDiscussion ? (
            <>
              <button
                className="back-to-discussions"
                onClick={handleBackToDiscussions}
              >
                Back to Discussions
              </button>
              <span>Discussion: {selectedDiscussion.title}</span>
            </>
          ) : (
            'Course Discussions'
          )}
        </h2>
        {!selectedDiscussion && (
          <button className="post-discussion-button" onClick={toggleNewDiscussionForm}>
            {showNewDiscussionForm ? 'Cancel' : 'Start a Discussion'}
          </button>
        )}
      </div>

      {showNewDiscussionForm && !selectedDiscussion && (
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

      {/* Modified: Display Selected Discussion with Threaded Replies */}
      {selectedDiscussion && (
        <div className="selected-discussion-container">
          <div className="selected-discussion">
            <div className="discussion-content">
              <div className="discussion-meta">
                <span className="discussion-author">
                  {selectedDiscussion.username || 'Anonymous'}
                  <span className="op-tag">OP</span>
                </span>
                <span className="discussion-date">{formatDate(selectedDiscussion.created_at)}</span>
              </div>

              {/* Title moved here, under the author info but above discussion body */}
              <h2 className="discussion-title-repositioned">
                {selectedDiscussion.title}
              </h2>

              <div className="discussion-body">
                {parseDescription(selectedDiscussion.description)}
              </div>
            </div>

            <div className="replies-container">
              <h3>Replies</h3>

              {loadingReplies ? (
                <div className="replies-loading">Loading replies...</div>
              ) : (
                <>
                  {replies.length === 0 ? (
                    <div className="no-replies">No replies yet. Be the first to reply!</div>
                  ) : (
                    <div className="replies-list">
                      {replies.map((reply) => (
                        <Reply
                          key={reply.id}
                          reply={reply}
                          courseId={courseId}
                          discussionId={selectedDiscussion.id}
                          onReplyAdded={handleReplyAdded}
                          originalPosterId={selectedDiscussion.user_id}
                        />
                      ))}
                    </div>
                  )}

                  <div className="reply-form-container">
                    <form onSubmit={handleSubmitReply} className="reply-form">
                      <textarea
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={handleReplyChange}
                        rows={3}
                      ></textarea>
                      <div className="reply-form-button-container">
                        <button
                          type="submit"
                          className="submit-reply-button"
                          disabled={submittingReply}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          </svg>
                          {submittingReply ? 'Submitting...' : 'Post Reply'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List of Discussions (only show when no discussion is selected) */}
      {!selectedDiscussion && !showNewDiscussionForm && (
        <>
          {!discussions || discussions.length === 0 ? (
            <div className="no-discussions">
              <p>No discussions yet. Start a new discussion to be the first!</p>
            </div>
          ) : (
            <div className="discussions-list">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="discussion-item" onClick={() => handleSelectDiscussion(discussion)}>
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
                    <span className="reply-count">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      {discussion.reply_count || 0} {discussion.reply_count === 1 ? 'Reply' : 'Replies'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseDiscussions;