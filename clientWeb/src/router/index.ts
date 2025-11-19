import { createRouter, createWebHistory } from "vue-router";
import authService from "@/services/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/controls",
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/controls",
      name: "Controls",
      component: () => import("@/views/ControlsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/alarms",
      name: "Alarms",
      component: () => import("@/views/AlarmsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "About",
      component: () => import("@/views/AboutView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/contacts",
      name: "Contacts",
      component: () => import("@/views/ContactsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/reachme",
      name: "ReachMe",
      component: () => import("@/views/ReachMeView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const isLoggedIn = await authService.isLoggedIn();

  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  } else if (to.path === "/login" && isLoggedIn) {
    next("/controls");
  } else {
    next();
  }
});

export default router;
