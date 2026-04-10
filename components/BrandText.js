import React from 'react';

const BrandText = ({ text, secondary = false, className = "", brandClassName = "" }) => {
  if (!text) return null;
  const brandNameRegex = /Banana Computer/gi;
  const parts = text.split(brandNameRegex);
  const matches = text.match(brandNameRegex);
  
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className={`font-pixel ${brandClassName || (secondary ? 'text-purple-brand/80' : 'text-purple-brand')}`}>
              {matches[i]}
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
};

export default BrandText;
