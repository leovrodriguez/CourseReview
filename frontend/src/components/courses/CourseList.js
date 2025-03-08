import React from 'react';
import CourseCard from './CourseCard';

const CourseList = ({ courses }) => {
  if (!courses || courses.length === 0) {
    return <p>No courses found.</p>;
  }

  return (
    <div className="course-list">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseList;
