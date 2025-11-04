import { useUserChatsMessageNotificationsCount } from "@/utils/messages";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { ChatNotificationsCount } from "@/backend/rpc/messages";
import { useAuth } from "@clerk/nextjs";

export function MessageNotifications({ className }: { className?: string }) {
  const { userId } = useAuth();
  const countQuery = useUserChatsMessageNotificationsCount(userId);

  if (!countQuery.data || countQuery.data == 0) {
    return;
  }

  return (
    <Badge
      variant={"brandRed"}
      className={cn("rounded-full p-0 h-5 min-w-5", className)}
    >
      {JSON.stringify(countQuery.data)}
    </Badge>
  );
}

export function ChatMessageNotifications({
  className,
  chatId,
  counts,
}: {
  className?: string;
  chatId: string;
  counts: ChatNotificationsCount[] | undefined;
}) {
  const count = counts?.find((c) => c.chatId == chatId);

  if (!count || count.count < 1) {
    return;
  }

  return (
    <Badge
      variant={"brandRed"}
      className={cn("rounded-full p-0 h-5 min-w-5", className)}
    >
      {count.count}
    </Badge>
  );
}
