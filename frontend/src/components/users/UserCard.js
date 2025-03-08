import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user }) => {
  const navigate = useNavigate();

  const handleRateCourse = () => {
    // Navigate to course selection page for rating
    navigate(`/user/${user.id}/rate-course-select`);
  };

  return (
    <div className="user-card">
      <h3>{user.username}</h3>
      <p>Email: {user.email}</p>
      <div className="user-actions">
        <button onClick={handleRateCourse}>Rate a Course</button>
      </div>
    </div>
  );
};

export default UserCard;
