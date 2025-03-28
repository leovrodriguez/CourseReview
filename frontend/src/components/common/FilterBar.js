// src/components/common/FilterBar.js
import { useState } from 'react';

export const FilterBar = ({onFiltersChange }) => {
  const [filters, setFilters] = useState({
    internalRating: null,
    externalRating: null,
    reviewCount: null,
    platformReviews: null,
    priceType: null
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <div className="filter-section-title">Internal Rating</div>
        <select onChange={(e) => handleFilterChange('internalRating', e.target.value)}>
          <option value="">Any Rating</option>
          {[1,2,3,4,5].map(rating => (
            <option key={`int-${rating}`} value={rating}>
              {rating}+ stars
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Platform Rating</div>
        <select onChange={(e) => handleFilterChange('externalRating', e.target.value)}>
          <option value="">Any Rating</option>
          {[1,2,3,4,5].map(rating => (
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
          onChange={(e) => handleFilterChange('reviewCount', e.target.value)}
        />
        <input
          type="number"
          placeholder="Platform Reviews"
          onChange={(e) => handleFilterChange('platformReviews', e.target.value)}
        />
      </div>

      <div className="filter-section">
        <div className="filter-section-title">Price</div>
        <select onChange={(e) => handleFilterChange('priceType', e.target.value)}>
          <option value="">Any Price</option>
          <option value="free">Free Courses</option>
          <option value="paid">Paid Courses</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;