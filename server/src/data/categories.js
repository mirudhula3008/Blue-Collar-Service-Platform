// Service categories are fixed for the hackathon, so they live in code
// rather than a collection. `id` is what gets stored in User.serviceCategory.
const categories = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', description: 'Leaks, taps, pipes, fittings and drainage' },
  { id: 'electrical', name: 'Electrical', icon: '💡', description: 'Wiring, switches, fans, lights and appliances' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚', description: 'Furniture repair, doors, shelves and fittings' },
  { id: 'painting', name: 'Painting', icon: '🎨', description: 'Interior, exterior and touch-up painting' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Home, kitchen, bathroom and deep cleaning' },
];

const categoryIds = categories.map((c) => c.id);

module.exports = { categories, categoryIds };
