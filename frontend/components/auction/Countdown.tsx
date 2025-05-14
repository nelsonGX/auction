import { useEffect, useState } from 'react';

interface CountdownProps {
  seconds: number | null;
  onComplete?: () => void;
}

export default function Countdown({ seconds, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  if (timeLeft === null) {
    return (
      <div className="text-center py-2">
        <p className="text-gray-500">Auction in progress</p>
      </div>
    );
  }

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const remainingSeconds = timeLeft % 60;
  
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  // Determine color based on time remaining
  let colorClass = 'text-gray-700';
  if (timeLeft <= 10) {
    colorClass = 'text-red-600 animate-pulse';
  } else if (timeLeft <= 30) {
    colorClass = 'text-red-600';
  } else if (timeLeft <= 60) {
    colorClass = 'text-yellow-600';
  }

  return (
    <div className="text-center py-2">
      <div className="text-sm text-gray-500 mb-1">Time Remaining</div>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {formattedTime}
      </div>
    </div>
  );
}