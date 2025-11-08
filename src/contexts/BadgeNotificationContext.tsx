import { createContext, useContext, useState, ReactNode } from "react";
import { BadgeAchievementNotification } from "@/components/BadgeAchievementNotification";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface BadgeNotificationContextType {
  showBadgeNotification: (badge: Badge) => void;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined);

export const BadgeNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

  const showBadgeNotification = (badge: Badge) => {
    setCurrentBadge(badge);
  };

  const handleClose = () => {
    setCurrentBadge(null);
  };

  return (
    <BadgeNotificationContext.Provider value={{ showBadgeNotification }}>
      {children}
      {currentBadge && (
        <BadgeAchievementNotification
          badge={currentBadge}
          onClose={handleClose}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
};

export const useBadgeNotification = () => {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error("useBadgeNotification must be used within BadgeNotificationProvider");
  }
  return context;
};
