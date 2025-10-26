// src/utils/toast.ts
export const TOAST = {
  DURATION: {
    short: 1800,   // success/info
    long: 3000,    // errors
  },
  msg: {
    // Auth
    login_success: "Logged in",
    login_failed: "Login failed. Check your email and password.",
    logout_success: "Logged out",
    signup_success: "Account created",
    signup_failed: "Signup failed. Try a different email.",

    // Pantry
    pantry_loaded: "Pantry loaded",
    pantry_saved: "Pantry saved",
    pantry_save_failed: "Failed to save pantry",
    pantry_added: "Added",
    pantry_duplicate: "Already in pantry",
    pantry_removed: "Removed",
    pantry_cleared: "Pantry cleared",

    // Favorites
    fav_added: "Added to favorites",
    fav_removed: "Removed from favorites",
    fav_failed: "Failed to update favorites",
    fav_load_failed: "Failed to load favorites",

    // History
    history_cleared: "History cleared",
    history_clear_failed: "Failed to clear history",
    history_load_failed: "Failed to load history",

    // Recipes
    recipe_load_failed: "Failed to load recipe",

    // Misc
    api_ok: "API is reachable",
    auth_required: "Please log in to continue",
  },
} as const;