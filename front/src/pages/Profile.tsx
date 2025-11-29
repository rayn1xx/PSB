import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  Calendar,
  Award,
  Bell,
  Shield,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  apiGetProfile,
  apiGetNotificationSettings,
  apiUpdateProfile,
  apiUpdateNotificationSettings,
  apiChangePassword,
} from "@/api/api";
import type { Profile as ProfileType, NotificationSettings } from "@/api/types";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [formProfile, setFormProfile] = useState<ProfileType | null>(null);

  const [notifSettings, setNotifSettings] =
    useState<NotificationSettings | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [p, n] = await Promise.all([
          apiGetProfile(),
          apiGetNotificationSettings(),
        ]);
        if (!isMounted) return;
        setProfile(p);
        setFormProfile(p);
        setNotifSettings(n);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Ошибка загрузки профиля",
          description: "Не удалось загрузить данные. Попробуйте позже.",
        });
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const initials =
    profile && (profile.firstName || profile.lastName)
      ? `${profile.firstName?.[0] ?? ""}${
          profile.lastName?.[0] ?? ""
        }`.toUpperCase()
      : "ST";

  // сохранение личных данных
  const handleSaveProfile = async () => {
    if (!formProfile) return;
    setIsSavingProfile(true);
    try {
      const updated = await apiUpdateProfile({
        firstName: formProfile.firstName,
        lastName: formProfile.lastName,
        email: formProfile.email,
        phone: formProfile.phone,
        group: formProfile.group,
        university: formProfile.university,
        timezone: formProfile.timezone,
      });
      setProfile(updated);
      setFormProfile(updated);
      toast({
        title: "Профиль обновлён",
        description: "Личные данные успешно сохранены.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: "Не удалось сохранить изменения профиля.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    if (profile) {
      setFormProfile(profile);
    }
  };

  // сохранение настроек уведомлений
  const handleSaveNotifications = async () => {
    if (!notifSettings) return;
    setIsSavingNotif(true);
    try {
      const saved = await apiUpdateNotificationSettings(notifSettings);
      setNotifSettings(saved);
      toast({
        title: "Настройки сохранены",
        description: "Параметры уведомлений обновлены.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: "Не удалось сохранить настройки уведомлений.",
      });
    } finally {
      setIsSavingNotif(false);
    }
  };

  // смена пароля
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Заполните все поля",
        description: "Введите текущий и новый пароль.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Пароли не совпадают",
        description: "Новый пароль и подтверждение должны совпадать.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const ok = await apiChangePassword(currentPassword, newPassword);
      if (ok) {
        toast({
          title: "Пароль изменён",
          description: "Ваш пароль был успешно обновлён.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          variant: "destructive",
          title: "Не удалось изменить пароль",
          description: "Проверьте текущий пароль и попробуйте ещё раз.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Ошибка изменения пароля",
        description: "Что-то пошло не так. Попробуйте позже.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Профиль</h1>
        <p className="text-muted-foreground">
          Управляйте своей учётной записью и настройками
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Profile Card */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>
              {profile
                ? `${profile.firstName ?? ""} ${
                    profile.lastName ?? ""
                  }`.trim() || "Студент ПСБ"
                : "Студент ПСБ"}
            </CardTitle>
            <CardDescription>
              {profile?.email ?? "student@psb.ru"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Студент с {profile?.enrolledSince ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>
                  {(profile?.completedCourses ?? 0) || 0} завершённых курса
                </span>
              </div>
            </div>
            <Separator />
            <Button className="w-full" variant="outline" disabled>
              Изменить фото
            </Button>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Личные данные</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="security">Безопасность</TabsTrigger>
          </TabsList>

          {/* Personal Info */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Личная информация</CardTitle>
                <CardDescription>
                  Обновите свои личные данные и контактную информацию
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={formProfile?.firstName ?? ""}
                      onChange={(e) =>
                        setFormProfile((prev) =>
                          prev ? { ...prev, firstName: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={formProfile?.lastName ?? ""}
                      onChange={(e) =>
                        setFormProfile((prev) =>
                          prev ? { ...prev, lastName: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="email"
                      type="email"
                      value={formProfile?.email ?? ""}
                      onChange={(e) =>
                        setFormProfile((prev) =>
                          prev ? { ...prev, email: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="flex gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formProfile?.phone ?? ""}
                      onChange={(e) =>
                        setFormProfile((prev) =>
                          prev ? { ...prev, phone: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Группа</Label>
                  <Input id="group" value={formProfile?.group ?? ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Год обучения</Label>
                  <Input
                    id="year"
                    value={profile?.enrolledSince?.toString() ?? ""}
                    disabled
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !formProfile}
                  >
                    {isSavingProfile ? "Сохранение..." : "Сохранить изменения"}
                  </Button>
                  <Button variant="outline" onClick={handleCancelProfile}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Настройки уведомлений</CardTitle>
                <CardDescription>
                  Управляйте тем, как и когда вы получаете уведомления
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email уведомления
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Новые комментарии</Label>
                        <p className="text-sm text-muted-foreground">
                          Уведомления о комментариях преподавателя
                        </p>
                      </div>
                      <Switch
                        checked={notifSettings?.emailAssignments ?? false}
                        onCheckedChange={(checked) =>
                          setNotifSettings((prev) =>
                            prev ? { ...prev, emailAssignments: checked } : prev
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Оценки и результаты</Label>
                        <p className="text-sm text-muted-foreground">
                          Уведомления о проверке заданий и тестов
                        </p>
                      </div>
                      <Switch
                        checked={notifSettings?.emailTests ?? false}
                        onCheckedChange={(checked) =>
                          setNotifSettings((prev) =>
                            prev ? { ...prev, emailTests: checked } : prev
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Новости и рассылки</Label>
                        <p className="text-sm text-muted-foreground">
                          Подборки материалов и новости платформы
                        </p>
                      </div>
                      <Switch
                        checked={notifSettings?.emailNews ?? false}
                        onCheckedChange={(checked) =>
                          setNotifSettings((prev) =>
                            prev ? { ...prev, emailNews: checked } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Внутренние напоминания
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Приближающиеся дедлайны</Label>
                        <p className="text-sm text-muted-foreground">
                          Напоминания о дедлайнах и важных событиях
                        </p>
                      </div>
                      <Switch
                        checked={notifSettings?.inAppReminders ?? false}
                        onCheckedChange={(checked) =>
                          setNotifSettings((prev) =>
                            prev ? { ...prev, inAppReminders: checked } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSavingNotif || !notifSettings}
                >
                  {isSavingNotif ? "Сохранение..." : "Сохранить настройки"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Безопасность</CardTitle>
                <CardDescription>
                  Управляйте паролем и настройками безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Пароль
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Текущий пароль</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новый пароль</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Подтвердите пароль
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Изменяем..." : "Изменить пароль"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Язык и регион
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="language">Язык интерфейса</Label>
                    <Input id="language" defaultValue="Русский" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Input
                      id="timezone"
                      defaultValue={
                        profile?.timezone
                          ? `${profile.timezone}`
                          : "Europe/Moscow (UTC+3)"
                      }
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
