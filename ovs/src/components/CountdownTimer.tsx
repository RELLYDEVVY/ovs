import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: Date;
  showIcon?: boolean;
  className?: string;
}

const CountdownTimer = ({ endDate, showIcon = true, className = '' }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // If the election has ended
      if (endDate < now) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }
      
      // Calculate the time difference
      const diffMs = endDate.getTime() - now.getTime();
      
      // Convert to days, hours, minutes, seconds
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds, isEnded: false });
    };
    
    // Calculate immediately
    calculateTimeRemaining();
    
    // Set up interval to update every minute (or every second if you want more precision)
    const intervalId = setInterval(calculateTimeRemaining, 60000); // 60000ms = 1 minute
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [endDate]);

  if (timeRemaining.isEnded) {
    return (
      <div className={`flex items-center ${className}`}>
        {showIcon && <Clock className="mr-1.5 h-3.5 w-3.5" />}
        <span>Ended</span>
      </div>
    );
  }

  // Format the display
  let displayText = '';
  
  if (timeRemaining.days > 0) {
    displayText += `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''} `;
  }
  
  if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
    displayText += `${timeRemaining.hours} hr${timeRemaining.hours !== 1 ? 's' : ''} `;
  }
  
  displayText += `${timeRemaining.minutes} min${timeRemaining.minutes !== 1 ? 's' : ''}`;
  
  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <Clock className="mr-1.5 h-3.5 w-3.5" />}
      <span>{displayText} remaining</span>
    </div>
  );
};

export default CountdownTimer;
