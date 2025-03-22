// src/components/common/SortBar.jsx
import React from 'react';

const SortBar = ({ onSort, sortConfig }) => {
  const sortOptions = [
    { value: '', label: 'Sort by...' },
    { value: 'internal_rating,desc', label: 'Our Ratings (Highest)' },
    { value: 'internal_rating,asc', label: 'Our Ratings (Lowest)' },
    { value: 'external_rating,desc', label: 'Provider Ratings (Highest)' },
    { value: 'external_rating,asc', label: 'Provider Ratings (Lowest)' },
  ];

  return (
    <div className="sort-bar-container">
      <div className="sort-select-wrapper">
        <select
          value={sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : ''}
          onChange={(e) => {
            const [key, direction] = e.target.value.split(',');
            onSort(key, direction);
          }}
          className="sort-select"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {sortConfig.key && (
        <span className="sort-indicator">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
}

export default SortBar;