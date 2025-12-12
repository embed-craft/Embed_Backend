const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:4000/api/v1/nudge/track';
const API_KEY = 'nk_live_bcecb88d32c3a9353e5e765f45e03055'; // From main.dart
const USER_ID = 'seed-user-001';

// Events to Seed
const events = [
  // Auth
  { name: 'login_viewed', props: {} },
  
  // Home
  { name: 'home_view', props: { screen_name: 'home_feed' } },
  { name: 'banner_clicked', props: { banner_text: 'Fresh Vegetables 40% OFF' } },
  { name: 'category_clicked', props: { category: 'Fruits' } },
  { name: 'product_clicked', props: { product_name: 'Hyderabadi Mango', price: 85 } },
  { name: 'add_to_cart_clicked', props: { product_name: 'Farm Fresh Onion', price: 25 } },
  { name: 'search_tapped', props: {} },
  { name: 'nav_tab_clicked', props: { tab: 'Offers', index: 3 } },
  { name: 'menu_clicked', props: {} },
  { name: 'join_program_clicked', props: { program: 'bbStar' } },

  // Cart
  { name: 'cart_viewed', props: { total_items: 3, total_value: 197.0 } },
  { name: 'cart_item_clicked', props: { name: 'Amul Taaza Milk', qty: '500 ml' } },

  // Checkout
  { name: 'checkout_viewed', props: {} },
  { name: 'payment_method_selected', props: { method: 'UPI' } },
  { name: 'order_completed', props: { order_id: 'ORD-SEED-123', total_value: 197.0, currency: 'INR' } },

  // Profile
  { name: 'profile_viewed', props: {} },
  { name: 'profile_menu_clicked', props: { menu_item: 'My Orders' } },
  { name: 'logout_clicked', props: {} }
];

async function seed() {
  console.log(`🌱 Seeding ${events.length} events to ${API_URL}...`);
  
  for (const event of events) {
    try {
      const payload = {
        action: event.name,
        properties: event.props,
        userId: USER_ID
      };

      const response = await axios.post(API_URL, payload, {
        headers: { 'x-api-key': API_KEY }
      });

      if (response.data.success) {
        console.log(`✅ Tracked: ${event.name}`);
      } else {
        console.warn(`⚠️ Issue with ${event.name}:`, response.data);
      }
    } catch (error) {
       console.error(`❌ Error tracking ${event.name}:`, error.message);
       if (error.response) console.error(error.response.data);
    }
  }
  console.log('✨ Seeding complete!');
}

seed();
