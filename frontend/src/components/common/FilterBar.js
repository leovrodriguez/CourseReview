// src/components/common/FilterBar.js
import { useState } from 'react';

export const FilterBar = ({ filters, onFiltersChange }) => {

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <div className="filter-section-title">Internal Rating</div>
        <select
          value={filters.internalRating || ''}
          onChange={(e) => handleFilterChange('internalRating', e.target.value)}
        >
          <option value="">Any Rating</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={`int-${rating}`} value={rating}>
              {rating}+ stars
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Platform Rating</div>
        <select
          value={filters.externalRating || ''}
          onChange={(e) => handleFilterChange('externalRating', e.target.value)}
        >
          <option value="">Any Rating</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={`ext-${rating}`} value={rating}>
              {rating}+ stars
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Review Counts</div>
        <input
          type="number"
          placeholder="Minimum Reviews"
          value={filters.reviewCount || ''}
          onChange={(e) => handleFilterChange('reviewCount', e.target.value)}
        />
        <input
          type="number"
          placeholder="Platform Reviews"
          value={filters.platformReviews || ''}
          onChange={(e) => handleFilterChange('platformReviews', e.target.value)}
        />
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Price</div>
        <select
          value={filters.priceType || ''}
          onChange={(e) => handleFilterChange('priceType', e.target.value)}
        >
          <option value="">Any Price</option>
          <option value="free">Free Courses</option>
          <option value="paid">Paid Courses</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;