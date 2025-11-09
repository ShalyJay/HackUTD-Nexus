import React from 'react';

type ProgressBarProps = {
  percentage: number;
  color?: string;
  backgroundColor?: string;
};

export default function ProgressBar({ 
  percentage, 
  color = "#22C55E", 
  backgroundColor = "#E5E7EB" 
}: ProgressBarProps) {
  return (
    <div style={{
      width: '100%',
      height: '8px',
      backgroundColor,
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
}