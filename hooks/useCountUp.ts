import { useEffect, useState } from 'react';

export function useCountUp(target: number | string, duration = 800) {
  const [count, setCount] = useState<number | string>(() => {
    // Start with 0 if it's numeric, or the target if not
    const num = typeof target === 'number' ? target : parseFloat(String(target));
    if (!isNaN(num)) {
      const targetStr = String(target);
      const match = targetStr.match(/^([\d.,]+)(.*)$/);
      if (match) {
        return `0${match[2]}`;
      }
      return 0;
    }
    return target;
  });

  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(String(target));
    if (isNaN(num)) {
      setCount(target);
      return;
    }

    let start = 0;
    const end = num;
    if (start === end) {
      setCount(target);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(start + easeProgress * (end - start));
      
      if (typeof target === 'number') {
        setCount(currentValue);
      } else {
        const targetStr = String(target);
        const match = targetStr.match(/^([\d.,]+)(.*)$/);
        if (match) {
          const suffix = match[2];
          setCount(`${currentValue}${suffix}`);
        } else {
          setCount(currentValue);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}
