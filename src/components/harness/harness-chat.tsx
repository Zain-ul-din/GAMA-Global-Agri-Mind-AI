"use client";
import {
  Fragment,
  use,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useEveAgent } from "eve/react";
import { cn } from "cn";
import { HarnessContext } from "./harness-provider";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoaderIcon } from "@hugeicons/core-free-icons";
import { ToolCallBadge } from "../ai/tool-call-badge";
import { boundsInFeet } from "@/lib/utils";

import Markdown from "react-markdown";

export function HarnessChat() {
  const { polygons } = use(HarnessContext);

  const agent = useEveAgent({
    onFinish: (snapShot) => {
      const toolCallMessages = snapShot.data.messages.filter((message) => {
        return message.parts.find((part) => part.type === "dynamic-tool");
      });
      const lastToolCallMessage = toolCallMessages.at(-1);
      if (!lastToolCallMessage) return;
      const toolCall = lastToolCallMessage?.parts.find(
        (part) => part.type === "dynamic-tool",
      );

      if (toolCall?.toolName !== "get-map-state") return;

      if (toolCall.state === "approval-requested") {
        setTimeout(() => {
          void agent.respond(
            [
              {
                requestId: toolCall.toolMetadata?.eve?.inputRequest
                  ?.requestId as string,
                text: JSON.stringify(
                  { polygons, boundsInFeet: boundsInFeet(polygons) },
                  null,
                  2,
                ),
                optionId: "approve",
              },
            ],
            {
              turnPolicy: "steer",
            },
          );
        }, 0);
      }
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const canSend = true;
  const resolving =
    agent.status === "streaming" || agent.status === "submitted";

  const [isLoading, startTransition] = useTransition();

  const send = () => {
    setMessage("");
    startTransition(async () => {
      await agent.send(message);
    });
  };

  // console.log(agent.data.messages);

  return (
    <div className="flex flex-col h-full">
      <ul className="flex-1 flex flex-col gap-4 p-2 py-4 overflow-y-auto">
        {agent.data.messages.map((message) => {
          return (
            <li key={message.id}>
              <div
                className={cn(
                  "flex w-full flex-col gap-1.5 transition-[opacity,filter,transform] duration-400 text-sm",
                  message.role === "user"
                    ? "text-left text-foreground/70 bg-muted p-1 w-fit min-w-8  ml-auto px-2 max-w-1/2"
                    : "text-left text-foreground/80",
                )}
                style={{
                  opacity: resolving ? 0.55 : 1,
                  filter: resolving ? "blur(0.1px)" : "blur(0)",
                  transform: resolving ? "scale(0.985)" : "scale(1)",
                  transformOrigin: "top left",
                  transitionTimingFunction: "cubic-bezier(0.32, 1, 0.52, 1)",
                  animation: "fade-up 400ms cubic-bezier(0.32,1,0.52,1) both",
                }}
              >
                {message.parts.map((part, i) => {
                  return (
                    <Fragment key={`${message.id}-${i}`}>
                      {(() => {
                        switch (part.type) {
                          case "step-start":
                            return "";
                          case "text":
                            return <Markdown>{part.text}</Markdown>;
                          case "dynamic-tool":
                            return <ToolCallBadge toolName={part.toolName} />;
                          default:
                            return "unhandled case";
                        }
                      })()}
                    </Fragment>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto shrink-0 p-1.5">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.025)]"
        >
          <input
            ref={inputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder={"Work with Gama"}
            aria-label="Chat prompt"
            className="min-h-4.5 bg-transparent text-[13px] leading-[1.4] text-ink outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className="flex size-7 items-center justify-center rounded-[8px]
                transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]"
              style={{
                background: canSend ? "var(--ink)" : "var(--line-strong)",
                color: canSend ? "var(--surface)" : "var(--ink-2)",
              }}
            >
              {isLoading ? (
                <HugeiconsIcon className="animate-spin" icon={LoaderIcon} />
              ) : (
                // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
