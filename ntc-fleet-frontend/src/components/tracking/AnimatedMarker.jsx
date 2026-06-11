import React, { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';

const AnimatedMarker = ({ position, icon, children, eventHandlers }) => {
  const markerRef = useRef(null);
  const prevPosition = useRef(position);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      const startPos = prevPosition.current;
      const endPos = position;

      // Don't animate if it's the very first render or position hasn't changed
      if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) return;

      const duration = 3000; // Match this with your simulation interval (3 seconds)
      const startTime = performance.now();

      const animateMarker = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // Simple linear interpolation
        const currentLat = startPos[0] + (endPos[0] - startPos[0]) * progress;
        const currentLng = startPos[1] + (endPos[1] - startPos[1]) * progress;

        marker.setLatLng([currentLat, currentLng]);

        if (progress < 1) {
          requestAnimationFrame(animateMarker);
        } else {
          prevPosition.current = position;
        }
      };

      requestAnimationFrame(animateMarker);
    }
  }, [position]);

  return (
    <Marker 
      ref={markerRef} 
      position={prevPosition.current} 
      icon={icon}
      eventHandlers={eventHandlers}
    >
      {children}
    </Marker>
  );
};

export default AnimatedMarker;
