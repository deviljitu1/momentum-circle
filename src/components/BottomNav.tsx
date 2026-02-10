import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Home, ListTodo, Trophy, User, Users, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAdmin } from "@/hooks/useAdmin";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/circles", icon: Users, label: "Circles" },
  { to: "/insights", icon: Sparkles, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin } = useAdmin();

  // Add Admin tab if user is admin
  const items = isAdmin
    ? [...navItems, { to: "/admin", icon: ShieldAlert, label: "Admin" }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center gap-1 px-3 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 w-10 h-1 rounded-full gradient-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {item.label}
              </span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
