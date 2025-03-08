// src/components/common/SearchBar.js
import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ placeholder, initialValue = '', onSearch, debounceTime = 500 }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const debounceTimerRef = useRef(null);

  // Update internal state if initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set up a new timer for debouncing
    debounceTimerRef.current = setTimeout(() => {
      onSearch(value);
    }, debounceTime);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Trigger search immediately on submit
    onSearch(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder || 'Search...'}
          className="search-input"
        />
        {inputValue && (
          <button 
            type="button" 
            onClick={handleClear} 
            className="search-clear-button"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
};

export default SearchBar;