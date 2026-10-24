// Booking state machine:
//   requested → accepted → in_progress → completed
//   requested → rejected            (worker)
//   requested | accepted → cancelled (customer)

const ACTIONS = {
  accept: { role: 'worker', from: ['requested'], to: 'accepted' },
  reject: { role: 'worker', from: ['requested'], to: 'rejected' },
  start: { role: 'worker', from: ['accepted'], to: 'in_progress' },
  complete: { role: 'worker', from: ['in_progress'], to: 'completed' },
  cancel: { role: 'customer', from: ['requested', 'accepted'], to: 'cancelled' },
};

const ACTIVE_STATUSES = ['requested', 'accepted', 'in_progress'];

module.exports = { ACTIONS, ACTIVE_STATUSES };
