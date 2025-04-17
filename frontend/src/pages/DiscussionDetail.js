// src/pages/DiscussionDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

const Reply = ({ reply, discussionId, depth = 0, onReplyAdded, originalPosterId }) => {
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

            const response = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}/reply/${reply.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
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

            const response = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}/reply/${reply.id}`, {
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

const DiscussionDetail = () => {
    const { discussionId } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [loadedCourseDetails, setLoadedCourseDetails] = useState({});

    // Fetch discussion details
    useEffect(() => {
        const fetchDiscussion = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch discussion');
                }

                const data = await response.json();
                setDiscussion(data);

                // Fetch replies
                const repliesResponse = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}/replies`);

                if (!repliesResponse.ok) {
                    throw new Error('Failed to fetch replies');
                }

                const repliesData = await repliesResponse.json();

                // Process replies to create a threaded structure
                const topLevelReplies = [];
                const replyMap = {};

                // First, create a map of all replies
                (repliesData.replies || []).forEach(reply => {
                    replyMap[reply.id] = {
                        ...reply,
                        child_replies: []
                    };
                });

                // Then, build the hierarchy
                (repliesData.replies || []).forEach(reply => {
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

                // Fetch course details for referenced courses
                if (data.referenced_course_ids && data.referenced_course_ids.length > 0) {
                    fetchCourseDetails(data.referenced_course_ids);
                }

            } catch (err) {
                console.error('Error fetching discussion:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussion();
    }, [discussionId]);

    // Function to fetch course details
    const fetchCourseDetails = async (courseIds) => {
        try {
            const courseDetailsPromises = courseIds.map(async (courseId) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/course/${courseId}`);
                    if (!response.ok) {
                        console.warn(`Failed to fetch details for course ${courseId}`);
                        return { [courseId]: { id: courseId, title: `Course Reference`, platform: '' } };
                    }
                    const courseDetails = await response.json();
                    return { [courseId]: courseDetails };
                } catch (error) {
                    console.error(`Error fetching details for course ${courseId}:`, error);
                    return { [courseId]: { id: courseId, title: `Course Reference`, platform: '' } };
                }
            });

            const courseDetailsResults = await Promise.all(courseDetailsPromises);
            const detailsMap = courseDetailsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});

            setLoadedCourseDetails(prev => ({ ...prev, ...detailsMap }));
        } catch (error) {
            console.error('Error fetching course details:', error);
        }
    };

    const handleBackToDiscussions = () => {
        navigate('/discussions');
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
            alert('You must be logged in to reply to a discussion');
            return;
        }

        // Validate input
        if (!replyText.trim()) {
            alert('Please enter a reply');
            return;
        }

        const userData = JSON.parse(userString);

        try {
            setSubmittingReply(true);

            const response = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
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
                user_id: userData.id,
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
        if (!discussionId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/course/discussion/${discussionId}/replies`);
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

    const parseDescription = (text) => {
        if (!text) return '';

        // This is a preview/display renderer
        const parts = text.split(/(\*\*\*\[\[course:[a-f0-9-]+\]\]\*\*\*)/g);

        return parts.map((part, index) => {
            const courseMatch = part.match(/\*\*\*\[\[course:([a-f0-9-]+)\]\]\*\*\*/);
            if (courseMatch) {
                const courseId = courseMatch[1];

                // Determine course details
                let courseDetails = loadedCourseDetails[courseId];

                // If no course details found, fallback to minimal representation
                if (!courseDetails) {
                    courseDetails = {
                        id: courseId,
                        title: `Course Reference (ID: ${courseId.substring(0, 8)}...)`,
                        platform: ''
                    };
                }

                // Display course reference
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

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return <div className="discussion-loading">Loading discussion...</div>;
    }

    if (error) {
        return <div className="discussion-error">Error loading discussion: {error}</div>;
    }

    if (!discussion) {
        return <div className="discussion-not-found">Discussion not found</div>;
    }

    return (
        <div className="discussion-detail-page">
            <div className="discussion-detail-header">
                <button
                    className="back-to-discussions"
                    onClick={handleBackToDiscussions}
                >
                    Back to Discussions
                </button>
                <h1>{discussion.title}</h1>
            </div>

            <div className="selected-discussion-container">
                <div className="selected-discussion">
                    <div className="discussion-content">
                        <div className="discussion-meta">
                            <span className="discussion-author">
                                {discussion.user_username || 'Anonymous'}
                                <span className="op-tag">OP</span>
                            </span>
                            <span className="discussion-date">{formatDate(discussion.created_at)}</span>
                        </div>

                        <div className="discussion-body">
                            {parseDescription(discussion.description)}
                        </div>
                    </div>

                    <div className="replies-container">
                        <h3>Replies</h3>

                        {replies.length === 0 ? (
                            <div className="no-replies">No replies yet. Be the first to reply!</div>
                        ) : (
                            <div className="replies-list">
                                {replies.map((reply) => (
                                    <Reply
                                        key={reply.id}
                                        reply={reply}
                                        discussionId={discussionId}
                                        onReplyAdded={handleReplyAdded}
                                        originalPosterId={discussion.user_id}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscussionDetail;