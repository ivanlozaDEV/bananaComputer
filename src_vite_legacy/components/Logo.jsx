import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  return (
    <div className={`rainbow-computer ${size}`}>
      <div className="rainbow-screen">
        <div className="stripe yellow"></div>
        <div className="stripe orange"></div>
        <div className="stripe red"></div>
        <div className="stripe purple"></div>
        <div className="stripe blue"></div>
        <div className="stripe green"></div>
        <span className="banana-symbol">🍌</span>
      </div>
      <div className="computer-base"></div>
    </div>
  );
};

export default Logo;
