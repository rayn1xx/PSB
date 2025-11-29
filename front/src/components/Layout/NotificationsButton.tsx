import { useEffect, useMemo, useState } from "react";
import { Bell, X, AlertCircle } from "lucide-react";
import { apiGetNotifications, apiMarkNotificationRead } from "@/api/api";
import type { NotificationItem } from "@/api/types";
import { cn } from "@/lib/utils";

export const NotificationsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    if (!isOpen || notifications.length > 0) return;

    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const data = await apiGetNotifications();
        if (!isMounted) return;
        setNotifications(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, notifications.length]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await apiMarkNotificationRead(id);
    } catch {
      //d
    }
  };

  return (
    <>
      {/* Кнопка */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-accent transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Плашка */}
      <div
        className={cn(
          "fixed right-4 top-16 z-50 w-full max-w-sm rounded-xl border border-border shadow-2xl transition-all",
          "bg-background text-foreground flex flex-col",
          isOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Header панели */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Уведомления</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount ? `Непрочитанных: ${unreadCount}` : "Все прочитаны"}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Контент */}
        <div className="max-h-[70vh] overflow-y-auto px-2 py-3">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              Загружаем уведомления…
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-6 w-6" />
              <span>У вас нет уведомлений</span>
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-lg p-3 border bg-card text-card-foreground shadow-sm",
                    !n.read && "border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{n.body}</p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {new Date(n.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-primary hover:underline"
                      >
                        Прочитать
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
