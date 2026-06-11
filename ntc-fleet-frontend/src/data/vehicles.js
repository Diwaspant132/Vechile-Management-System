export const dummyVehicles = [
  {
    id: 'V-101',
    plateNumber: 'Ba 1 Ja 1234',
    type: 'SUV',
    branch: 'BHADRAKALI_HO',
    driver: 'Ram Sharma',
    status: 'ACTIVE',
    fuelLevel: 75,
    speed: 45,
    lastUpdate: new Date().toISOString(),
    location: { lat: 27.7027, lng: 85.3168 }, // Near Bhadrakali
    destination: 'Ministry of IT, Singhadurbar',
    endLocation: { lat: 27.6970, lng: 85.3235 }, // Singhadurbar
    eta: '5 mins',
    route: [],
    routeProgress: 0,
    routeIndex: 0
  },
  {
    id: 'V-102',
    plateNumber: 'Ba 2 Ja 5678',
    type: 'Van',
    branch: 'JAWALAKHEL',
    driver: 'Sita Thapa',
    status: 'IDLE',
    fuelLevel: 40,
    speed: 0,
    lastUpdate: new Date().toISOString(),
    location: { lat: 27.6710, lng: 85.3123 }, // Patan
    destination: 'NTC Patan Branch',
    eta: '-',
    route: [],
    routeProgress: 0,
    routeIndex: 0
  },
  {
    id: 'V-103',
    plateNumber: 'Ba 3 Ja 9012',
    type: 'Sedan',
    branch: 'BABARMAHAL',
    driver: 'Hari Khadka',
    status: 'ACTIVE',
    fuelLevel: 90,
    speed: 60,
    lastUpdate: new Date().toISOString(),
    location: { lat: 27.6953, lng: 85.2869 }, // Kalanki
    destination: 'Airport Transfer',
    endLocation: { lat: 27.6950, lng: 85.3550 }, // Airport
    eta: '25 mins',
    route: [],
    routeProgress: 0,
    routeIndex: 0
  },
  {
    id: 'V-104',
    plateNumber: 'Ba 4 Ja 3456',
    type: 'Pickup',
    branch: 'MAHARAJGUNJ',
    driver: 'Gita Nepal',
    status: 'MAINTENANCE',
    fuelLevel: 15,
    speed: 0,
    lastUpdate: new Date().toISOString(),
    location: { lat: 27.7284, lng: 85.3206 }, // Maharajgunj Workshop
    destination: 'Workshop',
    eta: '-',
    route: [],
    routeProgress: 0,
    routeIndex: 0
  },
  {
    id: 'V-105',
    plateNumber: 'Ba 5 Ja 7890',
    type: 'SUV',
    branch: 'JAWALAKHEL',
    driver: 'Bishnu Prasad',
    status: 'OFFLINE',
    fuelLevel: 60,
    speed: 0,
    lastUpdate: new Date().toISOString(),
    location: { lat: 27.7000, lng: 85.3000 }, 
    destination: '-',
    eta: '-',
    route: [],
    routeProgress: 0,
    routeIndex: 0
  }
];
