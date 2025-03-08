import React from 'react';
import UserCard from './UserCard';

const UserList = ({ users }) => {
  if (!users || users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

export default UserList;
