import { Icon } from "./Icon";

export function Toast({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 z-[120] flex w-auto max-w-[calc(100vw-2.5rem)] -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${
        error ? "bg-[#8a2432]" : "bg-[#211e29]"
      }`}
      role="status"
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full ${
          error ? "bg-[#f6c9cf] text-[#7a1f2b]" : "bg-[#4fc69b] text-[#153f31]"
        }`}
      >
        <Icon name={error ? "close" : "check"} className="h-3 w-3" />
      </span>
      {message}
    </div>
  );
}
