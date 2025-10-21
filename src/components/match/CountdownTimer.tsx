
import React, { useState, useEffect, useRef } from 'react';
import { getSecondsUntil, formatCountdown, getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate?: Date;
  onComplete?: () => void;
  className?: string;
  refreshInterval?: number;
  showPhaseLabel?: boolean;
  useCurrentCycle?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete,
  className = "",
  refreshInterval = 500, // Default to 500ms (2 updates per second) for smoother countdown
  showPhaseLabel = false,
  useCurrentCycle = false,
}) => {
  // Use the current cycle or specific target date
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  const targetTimeRef = useRef<number>(targetDate ? new Date(targetDate).getTime() : cycleInfo.currentPhaseEndTime.getTime());
  const [seconds, setSeconds] = useState(getSecondsUntil(new Date(targetTimeRef.current)));
  const completedRef = useRef<boolean>(false);
  const lastPhaseRef = useRef<'match' | 'cooldown'>(cycleInfo.isInMatchPhase ? 'match' : 'cooldown');
  
  useEffect(() => {
    const updateCountdown = () => {
      // If using current cycle, get latest cycle info
      if (useCurrentCycle) {
        const newCycleInfo = getCurrentCycleInfo();
        setCycleInfo(newCycleInfo);
        
        // Check if we've switched phases
        const currentPhase = newCycleInfo.isInMatchPhase ? 'match' : 'cooldown';
        if (currentPhase !== lastPhaseRef.current) {
          lastPhaseRef.current = currentPhase;
          completedRef.current = false;
          
          // Phase change detected, update target
          targetTimeRef.current = newCycleInfo.currentPhaseEndTime.getTime();
          
          // If moving to cooldown phase, trigger onComplete
          if (currentPhase === 'cooldown' && onComplete) {
            onComplete();
          }
        }
        
        // Always use the current phase end time when in current cycle mode
        const newSeconds = getSecondsUntil(newCycleInfo.currentPhaseEndTime);
        setSeconds(newSeconds);
        
        // Check if countdown completed
        if (newSeconds <= 0 && !completedRef.current) {
          completedRef.current = true;
          if (onComplete) {
            onComplete();
          }
        }
      } else if (targetDate) {
        // Using fixed target date
        const newTargetTime = new Date(targetDate).getTime();
        if (targetTimeRef.current !== newTargetTime) {
          targetTimeRef.current = newTargetTime;
          completedRef.current = false;
        }
        
        const newSeconds = getSecondsUntil(new Date(targetTimeRef.current));
        setSeconds(newSeconds);
        
        if (newSeconds <= 0 && !completedRef.current) {
          completedRef.current = true;
          if (onComplete) {
            onComplete();
          }
        }
      }
    };
    
    // Initial update
    updateCountdown();
    
    // Set up interval
    const timer = setInterval(updateCountdown, refreshInterval);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete, refreshInterval, useCurrentCycle]);
  
  // Determine phase label
  const phaseLabel = cycleInfo.isInMatchPhase 
    ? "Match ends in:" 
    : "Next match starts in:";
  
  return (
    <div className={`font-mono flex items-center gap-1 ${className}`}>
      {showPhaseLabel && (
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span className="text-xs mr-1">{phaseLabel}</span>
        </div>
      )}
      <span>{formatCountdown(seconds)}</span>
    </div>
  );
};

export default CountdownTimer;
