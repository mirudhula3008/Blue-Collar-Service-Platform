// Service categories are fixed for the hackathon, so they live in code
// rather than a collection. `id` is what gets stored in User.serviceCategory.
const categories = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', description: 'Leaks, taps, pipes, fittings and drainage' },
  { id: 'electrical', name: 'Electrical', icon: '💡', description: 'Wiring, switches, fans, lights and appliances' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚', description: 'Furniture repair, doors, shelves and fittings' },
  { id: 'painting', name: 'Painting', icon: '🎨', description: 'Interior, exterior and touch-up painting' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Home, kitchen, bathroom and deep cleaning' },
  { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌', description: 'AC, fridge, washing machine, TV and more' },
  { id: 'vehicle_rental', name: 'Vehicle Rental', icon: '🚗', description: 'Rent cars, bikes and scooters by the day' },
  { id: 'car_wash', name: 'Car Wash', icon: '🚿', description: 'Doorstep car wash, interior cleaning, detailing' },
  { id: 'bike_wash', name: 'Bike Wash', icon: '🏍️', description: 'Bike wash, polish and chain cleaning' },
  { id: 'mechanic', name: 'Mechanic', icon: '🛠️', description: 'Car and bike repair, servicing, breakdown help' },
];

const categoryIds = categories.map((c) => c.id);

module.exports = { categories, categoryIds };
