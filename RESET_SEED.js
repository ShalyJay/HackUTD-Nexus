/**
 * Run this in your browser console to reset Firebase seeding
 * This will allow the app to re-seed with the updated mock data
 */

// Clear the seeding flag
localStorage.removeItem("firebaseSeeded");

// Optionally, also clear other app data
// localStorage.clear();

console.log("Firebase seeding flag cleared!");
console.log("Please refresh the page to re-seed the database.");
