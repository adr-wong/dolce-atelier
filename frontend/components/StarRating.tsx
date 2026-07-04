'use client';

import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`} role="img" aria-label={`${rating} de ${maxStars} estrellas`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;
        return (
          <button
            key={i}
            type="button"
            className={`${styles.star} ${filled ? styles.filled : styles.empty} ${interactive ? styles.interactive : ''}`}
            onClick={() => interactive && onChange?.(starValue)}
            disabled={!interactive}
            aria-label={`${starValue} estrella${starValue > 1 ? 's' : ''}`}
            tabIndex={interactive ? 0 : -1}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}
