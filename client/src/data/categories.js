// Mirrors server/src/data/categories.js; used by forms that need the list offline.
export const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '💡' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌' },
  { id: 'vehicle_rental', name: 'Vehicle Rental', icon: '🚗' },
  { id: 'car_wash', name: 'Car Wash', icon: '🚿' },
  { id: 'bike_wash', name: 'Bike Wash', icon: '🏍️' },
  { id: 'mechanic', name: 'Mechanic', icon: '🛠️' },
];

export const categoryIds = CATEGORIES.map((c) => c.id);
