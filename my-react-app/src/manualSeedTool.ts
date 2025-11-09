import { seedFirebase } from './seedFirebase';

/**
 * Manual Firebase Seeding Tool
 * 
 * This file can be imported and used to manually seed Firebase if needed.
 * 
 * Usage in browser console:
 * 1. Open DevTools (F12)
 * 2. Go to Console tab
 * 3. Run: seedFirebase()
 * 
 * Or programmatically:
 * import { seedFirebase } from './seedFirebase';
 * await seedFirebase();
 */

export async function manualSeed() {
  try {
    console.log("Starting manual Firebase seed...");
    const result = await seedFirebase();
    console.log("Seeding result:", result);
    console.log(
      `✓ Successfully created:
      - ${result.summary.vendorsCreated} vendors
      - ${result.summary.clientsCreated} clients
      - ${result.summary.standardsCreated} compliance standards`
    );
    return result;
  } catch (error) {
    console.error("Error during manual seeding:", error);
    throw error;
  }
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).manualSeed = manualSeed;
  (window as any).seedFirebase = seedFirebase;
}
