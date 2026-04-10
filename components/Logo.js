import React from 'react';
import styles from './Logo.module.css';

const Logo = ({ size = 'medium', animated = false }) => {
  return (
    <div className={`${styles.rainbowComputer} ${styles[size]} ${animated ? 'animate-slide-up' : ''}`}>
      <div className={styles.rainbowScreen}>
        <div className={`${styles.stripe} ${styles.stripeYellow}`}></div>
        <div className={`${styles.stripe} ${styles.stripeOrange}`}></div>
        <div className={`${styles.stripe} ${styles.stripeRed}`}></div>
        <div className={`${styles.stripe} ${styles.stripePurple}`}></div>
        <div className={`${styles.stripe} ${styles.stripeBlue}`}></div>
        <div className={`${styles.stripe} ${styles.stripeGreen}`}></div>
        <span className={`${styles.bananaSymbol} ${animated ? 'animate-bounce' : ''}`}>🍌</span>
      </div>
      <div className={styles.computerBase}></div>
    </div>
  );
};

export default Logo;
