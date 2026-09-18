import React, { useState, useEffect, useRef } from 'react';
import { GUJARAT_CITIES } from '../constants/gujaratCities';

export default function SearchableCitySelect({
  value = '',
  onChange,
  name = 'district',
  placeholder = 'Select or type a city...',
  required = false,
  disabled = false,
  style = {},
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync internal search term when external value prop changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filter cities dynamically as the user types
  const filteredCities = GUJARAT_CITIES.filter((city) =>
    city.toLowerCase().includes((searchTerm || '').trim().toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // If user typed something invalid that doesn't match, keep the last valid value
        if (value && searchTerm !== value) {
          setSearchTerm(value);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, searchTerm]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setSearchTerm(text);
    setIsOpen(true);
    // Trigger onChange with synthetic event to support standard form handlers
    if (onChange) {
      onChange({
        target: {
          name,
          value: text,
        },
      });
    }
  };

  const handleSelectCity = (city) => {
    setSearchTerm(city);
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          name,
          value: city,
        },
      });
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          name={name}
          required={required}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '10px 36px 10px 14px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            color: '#0f172a',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <span
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: 12,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            userSelect: 'none',
          }}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          <li
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#94a3b8',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}
          >
            Gujarat Cities & Districts ({filteredCities.length})
          </li>
          {filteredCities.length === 0 ? (
            <li
              style={{
                padding: '12px 14px',
                color: '#64748b',
                fontSize: '13px',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No matching Gujarat city found
            </li>
          ) : (
            filteredCities.map((city) => {
              const isSelected = value && value.toLowerCase() === city.toLowerCase();
              return (
                <li
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    color: isSelected ? '#0284c7' : '#0f172a',
                    fontWeight: isSelected ? 600 : 400,
                    background: isSelected ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <span>{city}</span>
                  {isSelected && <span style={{ color: '#0284c7', fontSize: '12px' }}>✓</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
