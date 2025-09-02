import { ProducerChatMessage } from "@/backend/rpc/messages";
import { cn } from "@/lib/utils";

export function MessageCard({
  message,
  userId,
}: {
  message: ProducerChatMessage;
  userId: string;
}) {
  const isMine = message.senderUserId === userId;

  return (
    <div
      className={cn(
        "border p-2 rounded-xl w-2/3",
        isMine ? "bg-brand-green text-white self-end" : "bg-muted self-start",
      )}
    >
      {message.content}
    </div>
  );
}
