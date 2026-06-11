import { useState, useEffect, useRef } from 'react';
import { dummyVehicles } from '../data/vehicles';

export const useLiveTracking = () => {
  const [vehicles, setVehicles] = useState(dummyVehicles);
  const [notifications, setNotifications] = useState([]);
  const fetchedRoutes = useRef(new Set());

  // Fetch actual road geometry from OSRM
  useEffect(() => {
    vehicles.forEach(vehicle => {
      if (vehicle.status === 'ACTIVE' && vehicle.endLocation && !fetchedRoutes.current.has(vehicle.id)) {
        fetchedRoutes.current.add(vehicle.id);
        const { lat: startLat, lng: startLng } = vehicle.location;
        const { lat: endLat, lng: endLng } = vehicle.endLocation;
        
        fetch(`https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes.length > 0) {
              // OSRM returns coordinates as [lng, lat]
              const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
              }));
              
              setVehicles(prev => prev.map(v => 
                v.id === vehicle.id ? { ...v, route: coordinates } : v
              ));
            }
          })
          .catch(err => console.error("Failed to fetch route for", vehicle.id, err));
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.status !== 'ACTIVE' || !vehicle.route || vehicle.route.length === 0) return vehicle;

          let newIndex = vehicle.routeIndex || 0;
          let newProgress = (vehicle.routeProgress || 0) + 0.35; // Move along the segment faster

          // If reached the end of the current segment
          if (newProgress >= 1) {
            newIndex++;
            newProgress = 0;
            
            // If reached the end of the entire route
            if (newIndex >= vehicle.route.length - 1) {
              newIndex = 0; // Looping back to start for the simulation demo
              
              addNotification({
                id: Date.now() + Math.random(),
                type: 'success',
                message: `${vehicle.plateNumber} has reached the destination.`,
                timestamp: new Date().toLocaleTimeString()
              });
            }
          }

          const currentPoint = vehicle.route[newIndex];
          const nextPoint = vehicle.route[newIndex + 1];

          // Linear interpolation between the two points
          const newLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * newProgress;
          const newLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * newProgress;

          // Occasionally add a notification
          if (Math.random() > 0.98) {
            addNotification({
              id: Date.now() + Math.random(),
              type: 'info',
              message: `${vehicle.plateNumber} is en route to ${vehicle.destination}.`,
              timestamp: new Date().toLocaleTimeString()
            });
          }

          return {
            ...vehicle,
            location: { lat: newLat, lng: newLng },
            routeIndex: newIndex,
            routeProgress: newProgress,
            lastUpdate: new Date().toISOString()
          };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  };

  return { vehicles, notifications };
};
