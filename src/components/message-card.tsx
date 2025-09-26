import { ProducerChatMessage } from "@/backend/rpc/messages";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
        "border border-white px-3 py-2 rounded-3xl md:max-w-2/3 relative",
        isMine
          ? "bg-indigo-700 text-white self-end whitespace-pre-wrap max-md:ml-5"
          : "bg-muted self-start max-md:ml-5"
      )}
    >
      {message.content}
      <span className="text-xs ml-2">{format(message.createdAt, "HH:mm")}</span>
    </div>
  );
}
