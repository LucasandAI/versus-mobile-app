
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MatchProgressBarProps {
  homeDistance: number;
  awayDistance: number;
  className?: string;
  animationDuration?: number;
}

const MatchProgressBar: React.FC<MatchProgressBarProps> = ({
  homeDistance,
  awayDistance,
  className,
  animationDuration = 200 // Faster animation for quick updates
}) => {
  const homeDistanceRef = useRef(homeDistance);
  const awayDistanceRef = useRef(awayDistance);
  
  const [displayHomePercentage, setDisplayHomePercentage] = useState(() => {
    const total = homeDistance + awayDistance || 1; // Avoid division by zero
    return (homeDistance / total) * 100;
  });
  
  const [displayHomeDistance, setDisplayHomeDistance] = useState(homeDistance);
  const [displayAwayDistance, setDisplayAwayDistance] = useState(awayDistance);
  
  useEffect(() => {
    // Only update if the distances have actually changed
    if (homeDistanceRef.current !== homeDistance || awayDistanceRef.current !== awayDistance) {
      // Calculate the actual percentage
      const total = homeDistance + awayDistance || 1; // Avoid division by zero
      const actualHomePercentage = (homeDistance / total) * 100;
      
      // Start animation from the current state to the new state
      const startTime = Date.now();
      const startHomePercentage = displayHomePercentage;
      const startHomeDistance = displayHomeDistance;
      const startAwayDistance = displayAwayDistance;
      
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Use easing function for smoother animation
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(1 - progress, 3);
        
        // Update displayed values
        setDisplayHomePercentage(startHomePercentage + (actualHomePercentage - startHomePercentage) * easeProgress);
        setDisplayHomeDistance(startHomeDistance + (homeDistance - startHomeDistance) * easeProgress);
        setDisplayAwayDistance(startAwayDistance + (awayDistance - startAwayDistance) * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };
      
      animateProgress();
      
      // Update refs to current values
      homeDistanceRef.current = homeDistance;
      awayDistanceRef.current = awayDistance;
    }
  }, [homeDistance, awayDistance, animationDuration, displayHomePercentage, displayHomeDistance, displayAwayDistance]);
  
  return (
    <div className={cn('w-full rounded-full h-6 overflow-hidden relative', className)}>
      <div className="absolute inset-0 flex w-full">
        <div 
          className="bg-green-500 h-full transition-all duration-300" 
          style={{ width: `${displayHomePercentage}%` }}
        />
        <div 
          className="bg-slate-800 h-full transition-all duration-300" 
          style={{ width: `${100 - displayHomePercentage}%` }}
        />
      </div>
      <div className="absolute inset-0 flex justify-between items-center px-3 text-xs font-semibold text-white">
        <span>{displayHomeDistance.toFixed(1)} km</span>
        <span>{displayAwayDistance.toFixed(1)} km</span>
      </div>
    </div>
  );
};

export default MatchProgressBar;
