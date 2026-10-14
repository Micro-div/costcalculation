"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Icon } from "@/components/common/Icon";
import {
  buildEstimateReadyMessage,
  buildLocalGreeting,
  detectLanguage,
  type ChatTurn,
} from "@/lib/chatFallback";
import { requestChatReply, wait } from "@/lib/chat";
import { matchLocation } from "@/lib";
import type { Country, Location, LocationId } from "@/types";

interface ChatWidgetProps {
  countries: Country[];
  locations: Location[];
  onCreateEstimate: (text: string, chosenLocationId?: LocationId) => void | Promise<void>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Present only on assistant messages that can be turned into an estimate.
  brief?: string;
  suggestEstimate?: boolean;
}

const FAB_SIZE = 58;
const DRAG_CLICK_THRESHOLD = 6;

// The minimum gap between sending a message and showing the reply, so the
// "thinking" state is always visible for a beat (the request runs alongside it).
const MIN_THINKING_MS = 1300;

const SUGGESTIONS = [
  "I need an ecommerce store for my clothing brand",
  "Build a 10 acre zoo in Lahore",
  "A mobile app for food delivery",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ChatWidget({
  countries,
  locations,
  onCreateEstimate,
}: ChatWidgetProps) {
  // `open` is the panel visibility. Minimising closes the panel but KEEPS the
  // conversation (so the floating button resumes exactly where it left off);
  // the X button also closes it AND starts a fresh chat next time.
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creatingBrief, setCreatingBrief] = useState<string | null>(null);
  // The brief of the estimate currently on the page, so the chat can apply
  // follow-up changes ("make it bigger", "add 3 floors") and re-estimate.
  const [activeBrief, setActiveBrief] = useState<string | null>(null);

  // Location picker: the chat can price for any country + city, independent of
  // whatever the main estimator currently has selected.
  const [countryId, setCountryId] = useState(countries[0]?.id ?? "us");
  const [locationId, setLocationId] = useState<LocationId>(
    countries[0]?.cities[0]
      ? locations.find((loc) => loc.countryId === countries[0].id)?.id ?? "us"
      : "us",
  );

  // Draggable floating button position (null = the default bottom-right spot).
  const [fabPos, setFabPos] = useState<{ left: number; top: number } | null>(
    null,
  );

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef({
    dragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
  });

  const [showDropZone, setShowDropZone] = useState(false);
  const [chatHidden, setChatHidden] = useState(false);
  const [overCross, setOverCross] = useState(false);
  const crossRef = useRef<HTMLDivElement>(null);

  const cities = useMemo(
    () => locations.filter((loc) => loc.countryId === countryId),
    [locations, countryId],
  );

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) ?? cities[0] ?? null,
    [locations, locationId, cities],
  );

  const locationLabelText = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.country}`
    : "";

  const seedGreeting = useCallback(() => {
    setMessages([
      { id: newId("greet"), role: "assistant", content: buildLocalGreeting() },
    ]);
  }, []);

  // Seed the greeting the first time the chat is opened.
  useEffect(() => {
    if (open && messages.length === 0) seedGreeting();
  }, [open, messages.length, seedGreeting]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // When the country changes, jump the city to that country's first city.
  const handleCountryChange = (nextCountryId: string) => {
    setCountryId(nextCountryId);
    const first = locations.find((loc) => loc.countryId === nextCountryId);
    if (first) setLocationId(first.id);
  };

  const resetChat = () => {
    setThinking(false);
    setCreatingBrief(null);
    setInput("");
    setActiveBrief(null);
    seedGreeting();
  };

  // X button: close AND start fresh next time.
  const closeChat = () => {
    setOpen(false);
    setMessages([]);
    setInput("");
    setThinking(false);
    setCreatingBrief(null);
    setActiveBrief(null);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinking) return;

    // If the message names a country or city, sync the picker to it.
    const found = matchLocation(text);
    if (found) {
      const loc = locations.find((item) => item.id === found);
      if (loc) {
        setCountryId(loc.countryId);
        setLocationId(loc.id);
      }
    }

    const userMessage: ChatMessage = {
      id: newId("u"),
      role: "user",
      content: text,
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setThinking(true);

    const turns: ChatTurn[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Run the request and a minimum-pause together so the answer never flashes
    // in instantly.
    const [reply] = await Promise.all([
      requestChatReply(turns, locationLabelText, activeBrief ?? ""),
      wait(MIN_THINKING_MS),
    ]);

    // Offline/fallback: merge the change into the existing brief so follow-up
    // tweaks still produce an updated estimate without the AI.
    let brief = reply.brief;
    if (
      reply.source === "fallback" &&
      activeBrief &&
      reply.suggestEstimate &&
      brief
    ) {
      brief = `${activeBrief}. Update: ${brief}`;
    } else if (reply.source === "fallback" && activeBrief && !brief) {
      brief = activeBrief;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: newId("a"),
        role: "assistant",
        content: reply.reply,
        suggestEstimate: reply.suggestEstimate,
        brief,
      },
    ]);
    setThinking(false);
  };

  const handleCreateEstimate = async (brief: string) => {
    if (!brief || creatingBrief) return;
    setCreatingBrief(brief);
    try {
      await onCreateEstimate(brief, selectedLocation?.id);
      setActiveBrief(brief);
      const lastUser =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      // Keep the chat open and confirm it worked, instead of vanishing.
      setMessages((prev) => [
        ...prev,
        {
          id: newId("ready"),
          role: "assistant",
          content: buildEstimateReadyMessage(detectLanguage(lastUser)),
        },
      ]);
    } finally {
      setCreatingBrief(null);
    }
  };

  // ---- Draggable floating button ------------------------------------------
  const onFabPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
    };
    setShowDropZone(true);
    setOverCross(false);
    btn.setPointerCapture(e.pointerId);
  };

  const onFabPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const left = clamp(
      e.clientX - drag.offsetX,
      8,
      window.innerWidth - FAB_SIZE - 8,
    );
    const top = clamp(
      e.clientY - drag.offsetY,
      8,
      window.innerHeight - FAB_SIZE - 8,
    );
    setFabPos({ left, top });

    if (crossRef.current) {
      const crossRect = crossRef.current.getBoundingClientRect();
      const fabCenterX = left + FAB_SIZE / 2;
      const fabCenterY = top + FAB_SIZE / 2;
      const isOver =
        fabCenterX > crossRect.left &&
        fabCenterX < crossRect.right &&
        fabCenterY > crossRect.top &&
        fabCenterY < crossRect.bottom;
      setOverCross(isOver);
    }
  };

  const onFabPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    drag.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // pointer capture may already be released
    }
    const moved =
      Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) >
      DRAG_CLICK_THRESHOLD;

    setShowDropZone(false);
    if (overCross) {
      setChatHidden(true);
      setFabPos(null);
    }
    setOverCross(false);

    if (!moved) {
      setOpen(true);
      setChatHidden(false);
    }
  };

  const onlyGreeting = messages.length <= 1 && !thinking;

  return (
    <>
      {/* Floating launcher — draggable. Hidden while the panel is open. */}
      {!open && !chatHidden && (
        <button
          type="button"
          aria-label="Open the CostCalc assistant"
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onClick={(e) => {
            // Keyboard activation fires a click with detail 0; pointer clicks
            // are handled in onPointerUp (so a drag never opens the panel).
            if (e.detail === 0) {
              setOpen(true);
              setChatHidden(false);
            }
          }}
          style={
            fabPos
              ? { left: fabPos.left, top: fabPos.top, right: "auto", bottom: "auto" }
              : undefined
          }
          className={`group fixed bottom-6 right-6 z-[80] grid h-[58px] w-[58px] touch-none select-none place-items-center rounded-full bg-gradient-to-br from-[#6754e7] to-[#8b5cf6] text-white shadow-[0_12px_34px_rgba(103,84,231,0.45)] transition-transform duration-300 hover:scale-[1.06] active:scale-95 ${chatHidden ? "hidden" : ""}`}
        >
          <Icon name="bot" className="relative h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22c55e]" />
          </span>
        </button>
      )}

      {/* Mobile/tablet/laptop dismiss cross - appears while dragging chatbot */}
      {showDropZone && (
        <div
          ref={crossRef}
          className="fixed bottom-8 left-1/2 z-[95] -translate-x-1/2 grid h-14 w-14 touch-none select-none place-items-center rounded-full bg-black/80 text-white shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all duration-150 ease-out"
          style={{
            transform: `translateX(-50%) scale(${overCross ? 1.15 : 1})`,
            opacity: overCross ? 1 : 0.9,
          }}
        >
          <Icon
            name="close"
            className={`h-5 w-5 transition-transform duration-150 ${overCross ? "scale-110" : ""}`}
          />
          {overCross && (
            <span className="absolute -top-6 whitespace-nowrap rounded-full bg-black/90 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg">
              Drop to hide
            </span>
          )}
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <section
          aria-label="CostCalc assistant"
          className="fixed bottom-6 right-6 z-[80] flex h-[min(560px,calc(100vh-3rem))] w-[min(388px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-[#e8e5ed] bg-white shadow-[0_28px_70px_rgba(30,20,60,0.28)]"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 bg-gradient-to-br from-[#6754e7] to-[#8b5cf6] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
                <Icon name="sparkles" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">CostCalc assistant</p>
                <p className="truncate text-[11px] text-white/80">
                  {locationLabelText || "Ask me to price your project"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={resetChat}
                aria-label="Refresh chat"
                title="New chat"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/90 transition hover:bg-white/20"
              >
                <Icon name="rotate" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize chat"
                title="Minimize"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/90 transition hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                title="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/90 transition hover:bg-white/20"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Location picker */}
          <div className="flex items-center gap-2 border-b border-[#f0eef3] bg-[#faf9fc] px-4 py-2.5">
            <Icon name="globe" className="h-4 w-4 shrink-0 text-[#8b86a0]" />
            <select
              aria-label="Country"
              value={countryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#e8e5ed] bg-white px-2 py-1.5 text-xs font-medium text-[#3a3641] outline-none focus:border-[#6754e7]"
            >
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.country}
                </option>
              ))}
            </select>
            <select
              aria-label="City"
              value={selectedLocation?.id ?? ""}
              onChange={(e) => setLocationId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#e8e5ed] bg-white px-2 py-1.5 text-xs font-medium text-[#3a3641] outline-none focus:border-[#6754e7]"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.city}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#fbfaff] px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#6754e7] text-white"
                      : "rounded-bl-md border border-[#efeCF5] bg-white text-[#2b2732]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.role === "assistant" &&
                    message.suggestEstimate &&
                    message.brief && (
                      <button
                        type="button"
                        disabled={creatingBrief !== null}
                        onClick={() => handleCreateEstimate(message.brief ?? "")}
                        className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#5643d6] disabled:opacity-60"
                      >
                        {creatingBrief === message.brief ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                            Creating estimate…
                          </>
                        ) : (
                          <>
                            <Icon name="zap" className="h-3.5 w-3.5" />
                            {activeBrief ? "Update estimate" : "Create estimate"}
                          </>
                        )}
                      </button>
                    )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#efeCF5] bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#b8b1d4] [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#b8b1d4] [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#b8b1d4]" />
                </div>
              </div>
            )}

            {onlyGreeting && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-[#e4e0ee] bg-white px-3 py-1.5 text-left text-[11px] font-medium text-[#5b5570] transition hover:border-[#6754e7] hover:text-[#6754e7]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-[#f0eef3] bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeBrief
                  ? "Koi tabdeeli batao… e.g. size baro, 3 floors add karo"
                  : "Describe your project…"
              }
              className="min-w-0 flex-1 rounded-xl border border-[#e8e5ed] bg-[#faf9fc] px-3.5 py-2.5 text-sm text-[#2b2732] outline-none transition focus:border-[#6754e7] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6754e7] text-white transition hover:bg-[#5643d6] disabled:opacity-50"
            >
              <Icon name="arrow-right" className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
