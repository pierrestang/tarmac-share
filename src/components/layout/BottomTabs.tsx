import { NavLink } from "@/components/NavLink";
import { useUnreadMessagesCount } from "@/hooks/use-messages";
import { useNotificationsUnreadCount } from "@/hooks/use-notifications";
import { useProfiles } from "@/hooks/use-profiles";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MapPin, PlusCircle, MessageCircle, CircleUserRound } from "lucide-react";

const tabs: Array<{ label: string; to: string; hasBadge?: boolean; icon: React.ElementType }> = [
  { label: "Trajets", to: "/trajets", icon: MapPin },
  { label: "Publier", to: "/publier", icon: PlusCircle },
  { label: "Messages", to: "/messages", hasBadge: true, icon: MessageCircle },
  { label: "Compte", to: "/compte", icon: CircleUserRound },
];

export function BottomTabs() {
  const { getActiveProfile } = useProfiles();
  const activeProfile = getActiveProfile();
  const { count: messagesCount } = useUnreadMessagesCount(activeProfile?.id);
  const { count: notificationsCount } = useNotificationsUnreadCount(activeProfile?.id);
  const totalCount = messagesCount + notificationsCount;
  const location = useLocation();
  const isMessagesPage = location.pathname === "/messages";

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border",
        isMessagesPage ? "" : "bg-card"
      )}
      style={isMessagesPage ? { backgroundColor: "#F0EEE9" } : undefined}
    >
      <div className="grid h-16 w-full grid-cols-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[12px] font-normal",
                isMessagesPage ? "" : "text-muted-foreground"
              )}
              activeClassName={isMessagesPage ? "" : "text-card-foreground"}
              style={isMessagesPage ? { color: "#4E657A" } : undefined}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={1.5} />
                {t.hasBadge && totalCount > 0 ? (
                  <span
                    aria-label={`${totalCount} notification${totalCount > 1 ? "s" : ""} non lue${totalCount > 1 ? "s" : ""}`}
                    className={cn(
                      "absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      "border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))]",
                    )}
                  >
                    {totalCount}
                  </span>
                ) : null}
              </span>
              <span>{t.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
