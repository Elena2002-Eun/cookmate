// src/utils/preloadRoutes.js
export const loaders = {
  Recipes:   () => import("../pages/Recipes"),
  Recipe:    () => import("../pages/Recipe"),
  Favorites: () => import("../pages/Favorites"),
  Login:     () => import("../pages/Login"),
  Signup:    () => import("../pages/Signup"),
  History:   () => import("../pages/History"),
  Pantry:    () => import("../pages/Pantry"),
  NotFound:  () => import("../pages/NotFound"),
};

export function preload(name) {
  const fn = loaders[name];
  if (fn) fn();
}