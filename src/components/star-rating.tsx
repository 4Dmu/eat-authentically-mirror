import { Stars } from "@/backend/validators/reviews";
import { cn } from "@/lib/utils";
import { LucideProps } from "lucide-react";
import { Dispatch, SetStateAction, useState, Ref } from "react";

const items = [
  [0.5, 1],
  [1.5, 2],
  [2.5, 3],
  [3.5, 4],
  [4.5, 5],
] as const;

export function StarRating({
  selected,
  setSelected,
}: {
  selected: Stars;
  setSelected: Dispatch<SetStateAction<Stars>>;
}) {
  const [hovered, setHovered] = useState<Stars>(0);

  return (
    <div className="flex gap-1  items-center">
      {items.map(([first, second], i) => (
        <div className="flex size-10" key={i}>
          <button
            onMouseEnter={() => setHovered(first)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              if (selected == first) {
                setSelected(0);
              } else {
                setSelected(first);
              }
            }}
            className="w-full"
          >
            <StarHalfIcon
              strokeWidth={"1"}
              className={cn(
                "w-full h-full hover:fill-yellow-400",
                first <= selected && "fill-yellow-600 stroke-yellow-600",
                first <= hovered && "fill-yellow-400"
              )}
            />
          </button>
          <button
            onMouseEnter={() => setHovered(second)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              if (selected == second) {
                setSelected(0);
              } else {
                setSelected(second);
              }
            }}
            className="w-full"
          >
            <StarHalfIcon
              strokeWidth={"1"}
              className={cn(
                "rotate-y-180 w-full h-full hover:fill-yellow-400",
                second <= selected && "fill-yellow-600 stroke-yellow-600",
                second <= hovered && "fill-yellow-400"
              )}
            />
          </button>
        </div>
      ))}
      <span className="font-bold">({selected})</span>
    </div>
  );
}

export function StarRatingReadonly({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 items-center">
      {items.map(([first, second], i) => (
        <div className="flex" key={i}>
          <StarHalfIcon
            strokeWidth={"1"}
            className={cn(
              "w-full h-full stroke-yellow-600",
              first <= rating && "fill-yellow-600"
            )}
          />

          <StarHalfIcon
            strokeWidth={"1"}
            className={cn(
              "rotate-y-180 w-full h-full stroke-yellow-600",
              second <= rating && "fill-yellow-600"
            )}
          />
        </div>
      ))}
      <span className="font-bold">({rating})</span>
    </div>
  );
}

function StarHalfIcon(props: LucideProps & { ref?: Ref<SVGSVGElement> }) {
  return (
    <svg
      fill="none"
      ref={props.ref}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="24"
      viewBox="0 0 12 24"
      className={cn(
        "lucide lucide-star-half-icon lucide-star-half",
        props.className
      )}
    >
      <path d="M12 18.338a2.1 2.1 0 0 0-.987.244L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.309-4.679A.53.53 0 0 1 12 2" />
    </svg>
  );
}
