import { useEffect, useMemo, useState } from "react";
import { MessageCircle, SendHorizonal } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  apiGetChatChannels,
  apiGetChatMessages,
  apiSendChatMessage,
} from "@/api/api";

import type { ChatChannel, ChatMessage } from "@/api/types";

type CourseChatProps = {
  courseId: string;
};

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as { id: string; name: string; email: string };
  } catch {
    return null;
  }
}

const CourseChat = ({ courseId }: CourseChatProps) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const studentId = currentUser?.id ?? "local_student";
  const studentName = currentUser?.name ?? "Вы";

  // Загрузка каналов чата для курса
  useEffect(() => {
    let cancelled = false;

    async function loadChannels() {
      setIsLoadingChannels(true);
      setError(null);
      try {
        const ch = await apiGetChatChannels(courseId);
        if (cancelled) return;
        setChannels(ch);
        if (ch.length && !activeChannelId) {
          setActiveChannelId(ch[0].id);
        }
      } catch (e) {
        console.error("loadChannels error", e);
        if (!cancelled) setError("Не удалось загрузить каналы чата");
      } finally {
        if (!cancelled) setIsLoadingChannels(false);
      }
    }

    loadChannels();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Загрузка сообщений для выбранного канала
  useEffect(() => {
    if (!activeChannelId) return;
    let cancelled = false;

    async function loadMessages() {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const res = await apiGetChatMessages(activeChannelId);
        if (cancelled) return;
        setMessages(res.messages ?? []);
      } catch (e) {
        console.error("loadMessages error", e);
        if (!cancelled) setError("Не удалось загрузить сообщения");
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeChannelId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      ),
    [messages]
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChannelId) return;

    setIsSending(true);
    setError(null);

    const newMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      author: {
        id: studentId,
        name: studentName,
        role: "student",
      },
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    // Оптимистично добавляем сообщение
    setMessages((prev) => [...prev, newMsg]);
    setText("");

    try {
      await apiSendChatMessage(activeChannelId, trimmed);
      // здесь можно было бы перезагрузить сообщения, но для моков не обязательно
    } catch (e) {
      console.error("send message error", e);
      setError("Не удалось отправить сообщение");
      // если хочешь, можно откатить сообщение из списка
    } finally {
      setIsSending(false);
    }
  }

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Чат курса</CardTitle>
          </div>
          {activeChannel && activeChannel.unreadCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {activeChannel.unreadCount} новых
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Задавайте вопросы преподавателю и обсуждайте задания.
        </CardDescription>

        {/* Переключатель каналов */}
        {channels.length > 1 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {channels.map((ch) => (
              <Button
                key={ch.id}
                type="button"
                size="sm"
                variant={ch.id === activeChannelId ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setActiveChannelId(ch.id)}
              >
                {ch.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 pt-0">
        {isLoadingChannels && (
          <p className="text-xs text-muted-foreground">
            Загружаем каналы чата...
          </p>
        )}

        {!isLoadingChannels && !activeChannelId && (
          <p className="text-xs text-muted-foreground">
            Для этого курса пока нет чатов.
          </p>
        )}

        {error && <p className="text-xs text-destructive mb-1">{error}</p>}

        {/* Сообщения */}
        {activeChannelId && (
          <>
            <div className="flex-1 min-h-[160px] max-h-80 overflow-y-auto rounded-md border border-border bg-muted/40 p-2 space-y-2 text-xs">
              {isLoadingMessages && (
                <p className="text-muted-foreground">Загружаем сообщения...</p>
              )}

              {!isLoadingMessages && sortedMessages.length === 0 && (
                <p className="text-muted-foreground">
                  В этом чате пока нет сообщений. Напишите первым.
                </p>
              )}

              {!isLoadingMessages &&
                sortedMessages.map((msg) => {
                  const isTeacher = msg.author.role === "teacher";
                  const isMe = msg.author.id === studentId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isTeacher
                          ? "justify-start"
                          : isMe
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-lg px-3 py-2 shadow-sm",
                          isTeacher
                            ? "bg-primary/10 text-foreground"
                            : "bg-background border border-border",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-semibold">
                            {isTeacher
                              ? `${msg.author.name} · преп.`
                              : msg.author.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "ru-RU",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                        <p className="text-xs leading-snug whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Форма отправки */}
            <form
              onSubmit={handleSend}
              className="mt-2 flex items-center gap-2"
            >
              <Input
                placeholder="Напишите сообщение..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSending || !activeChannelId}
                className="text-xs"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !text.trim() || !activeChannelId}
                className="shrink-0"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseChat;
