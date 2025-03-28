import { useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export const FilterBar = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <div className="filter-section-title">RateMyCourse Minimum Star Rating</div>
        <select
          value={filters.internalRating || ''}
          onChange={(e) => handleFilterChange('internalRating', e.target.value)}
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
          value={filters.externalRating || ''}
          onChange={(e) => handleFilterChange('externalRating', e.target.value)}
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
        <div className="filter-section-title">Minimum Review Counts</div>
        <input
          type="number"
          placeholder="Minimum RateMyCourse Ratings"
          value={filters.internalReviewCount || ''}
          onChange={(e) => handleFilterChange('internalReviewCount', e.target.value)}
        />
        <input
          type="number"
          placeholder="Minimum Provider Ratings"
          value={filters.externalReviewCount || ''}
          onChange={(e) => handleFilterChange('externalReviewCount', e.target.value)}
        />
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Price</div>
        <select
          value={filters.isFree || ''}
          onChange={(e) => handleFilterChange('isFree', e.target.value)}
        >
          <option value="">Any Price</option>
          <option value="true">Free Courses</option>
          <option value="false">Paid Courses</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;