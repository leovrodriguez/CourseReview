import React, { useState } from 'react';

export const FilterBar = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    onFiltersChange(localFilters); // Apply the filters globally
  };

  return (
    <form className="filter-bar" onSubmit={handleSubmit}>
      <div className="filter-section">
        <div className="filter-section-title">RateMyCourse Minimum Star Rating</div>
        <select
          value={localFilters.internalRating || ''}
          onChange={(e) => handleInputChange('internalRating', e.target.value)}
        >
          <option value="">Any Rating</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={`int-${rating}`} value={rating}>
              {rating} stars
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Provider Minimum Star Rating</div>
        <select
          value={localFilters.externalRating || ''}
          onChange={(e) => handleInputChange('externalRating', e.target.value)}
        >
          <option value="">Any Rating</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={`ext-${rating}`} value={rating}>
              {rating} stars
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">RateMyCourse Minimum Review Counts</div>
        <input
          type="number"
          placeholder="Minimum Ratings"
          value={localFilters.internalReviewCount || ''}
          onChange={(e) => handleInputChange('internalReviewCount', e.target.value)}
        />
      </div>
      <div className="filter-section">
      <div className="filter-section-title">Provider Minimum Review Counts</div>
        <input
          type="number"
          placeholder="Minimum Ratings"
          value={localFilters.externalReviewCount || ''}
          onChange={(e) => handleInputChange('externalReviewCount', e.target.value)}
        />
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Price</div>
        <select
          value={localFilters.isFree || ''}
          onChange={(e) => handleInputChange('isFree', e.target.value)}
        >
          <option value="">Any Price</option>
          <option value="true">Free Courses</option>
          <option value="false">Paid Courses</option>
        </select>
      </div>

      <button type="submit" className="apply-filters-button">
        Apply Filters
      </button>
    </form>
  );
};

export default FilterBar;