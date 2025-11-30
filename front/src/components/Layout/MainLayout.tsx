import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ...

<NotificationsButton />;
import { NotificationsButton } from "./NotificationsButton";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiMe, apiGetNotifications } from "@/api/api";
import {
  BookOpen,
  Calendar,
  Bell,
  User,
  LogOut,
  Settings,
  Home,
  FileText,
  MessageSquare,
  BarChart3,
} from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Проверяем локально: есть ли токен или user
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      // Если вообще ничего нет – реально гоним на /auth
      if (!token && !storedUser) {
        navigate("/auth", { replace: true });
        return;
      }

      try {
        // 2. Пытаемся подтянуть me с бэка (если упадёт – apiMe вернёт мок)
        const me = await apiMe();
        if (!isMounted) return;

        if (me) {
          setUser({ name: me.name, email: me.email });
        } else if (storedUser) {
          // fallback: берём из localStorage
          try {
            const parsed = JSON.parse(storedUser) as {
              name?: string;
              email?: string;
            };
            setUser({
              name: parsed.name ?? "Студент",
              email: parsed.email ?? "",
            });
          } catch {
            // игнорируем
          }
        }

        // 3. Тянем уведомления, но ошибки не считаем поводом выкидывать на /auth
        try {
          try {
            const notifs = await apiGetNotifications();
            if (!isMounted) return;

            const unreadCount = Array.isArray(notifs)
              ? notifs.filter((n) => !n.read).length
              : 0;

            setNotifications(unreadCount);
          } catch (e) {
            console.warn("load notifications failed", e);
            setNotifications(0);
          }
        } catch (e) {
          console.warn("load notifications failed", e);
        }
      } catch (e) {
        console.warn("init layout failed", e);
        // ВАЖНО: не делаем navigate("/auth"), просто живём с мок-юзером
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as {
              name?: string;
              email?: string;
            };
            setUser({
              name: parsed.name ?? "Студент",
              email: parsed.email ?? "",
            });
          } catch {
            // ignore
          }
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  const navigation = [
    { name: "Мои курсы", href: "/", icon: Home },
    { name: "Календарь", href: "/calendar", icon: Calendar },
    { name: "Профиль", href: "/profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">ПСБ</span>
              <span className="text-xs text-muted-foreground">
                Школа Цифровых Ролей
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2",
                      isActive(item.href) &&
                        "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationsButton />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Профиль
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
