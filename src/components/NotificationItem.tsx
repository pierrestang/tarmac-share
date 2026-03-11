import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  muted?: boolean;
  badge?: string;
  badgeVariant?: "default" | "green" | "red";
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

export function NotificationItem({ notification, onClick, muted = false, badge, badgeVariant = "default" }: NotificationItemProps) {
  const badgeClasses = {
    default: "bg-muted text-muted-foreground",
    green: "bg-success text-success-foreground border border-success-foreground/20",
    red: "bg-[#e34454]/15 text-[#e34454] border border-[#e34454]/30"
  };
  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left transition-colors",
        muted ? "opacity-60 cursor-default" : "hover:bg-muted/50",
        !notification.read && !muted && "bg-muted/30"
      )}>
      

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-card-foreground text-sm",

          !notification.read && "font-semibold"
          )}>
            {notification.title}
          </span>
          {!notification.read && !muted &&
          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          }
          {badge &&
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0", badgeClasses[badgeVariant])}>
              {badge}
            </span>
          }
        </div>
        <p className="text-card-foreground line-clamp-2 mt-1 text-xs">
          {notification.message}
        </p>
        <span className="text-card-foreground mt-1 block text-xs">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
    </button>);

}