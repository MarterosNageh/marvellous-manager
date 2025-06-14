
import React, { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, MessageCircle, UserCircle, AlertTriangle } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  isError?: boolean;
}

const EDGE_URL =
  "https://venxltsumlixfgysffqu.functions.supabase.co/technical-chatbot";

export default function TechnicalChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  function mapRole(role: string): "user" | "model" {
    if (role === "user") return "user";
    return "model";
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim() }
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      let data: { text?: string; error?: string } = {};

      // try to parse json gracefully
      try {
        data = await res.json();
      } catch (jsonError) {
        data = { error: "Invalid response from server." };
      }

      if (data.error) {
        setMessages([
          ...nextMessages,
          { role: "model", content: `❌ AI Error: ${data.error}`, isError: true }
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            role: "model",
            content: data.text ?? "No response from AI."
          }
        ]);
      }

    } catch (err: any) {
      setMessages([
        ...messages,
        {
          role: "model",
          content: "Sorry, there was a problem getting a response. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => endOfChatRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10 px-2 w-full">
        <div className="flex items-center gap-3 justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-blue-800" />
          <h1 className="font-bold text-3xl tracking-tight text-blue-900 text-center select-none">
            Tech Chatbot
          </h1>
        </div>
        <div className="text-center text-gray-500 mb-5">
          Get instant help for IT, software, and technology topics.<br className="hidden sm:block" />
          <span className="text-xs text-blue-800 italic">
            (Only answers technical questions.)
          </span>
        </div>
        <Card className="h-[430px] sm:h-[500px] overflow-y-auto px-2 py-4 flex flex-col gap-2 bg-white mb-4 border border-blue-200 shadow-md rounded-lg transition-all duration-200">
          {messages.length === 0 && (
            <div className="text-gray-400 text-center my-auto animate-fade-in">
              👋 Ask me a technical question!
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex w-full items-end mb-1
                ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Show icon for model (AI) or user */}
              {msg.role === "model" && (
                <div className="mr-2 flex-shrink-0">
                  {msg.isError ? (
                    <AlertTriangle className="rounded-full bg-red-100 p-1 text-red-600 h-8 w-8 shadow" />
                  ) : (
                    <MessageCircle className="rounded-full bg-blue-100 p-1 text-blue-800 h-8 w-8 shadow" />
                  )}
                </div>
              )}
              <div
                className={`
                  px-4 py-2 rounded-2xl max-w-[82%] sm:max-w-[68%] whitespace-pre-line
                  text-base leading-relaxed
                  border
                  ${
                    msg.role === "user"
                      ? "bg-blue-100 border-blue-200 text-blue-900 ml-auto animate-fade-in"
                      : msg.isError
                        ? "bg-red-50 border-red-200 text-red-700 animate-fade-in"
                        : "bg-gray-100 border-gray-200 text-gray-800 animate-fade-in"
                  }
                `}
                style={{
                  borderTopRightRadius: msg.role === "user" ? "0.35rem" : "1.5rem",
                  borderTopLeftRadius: msg.role === "model" ? "0.35rem" : "1.5rem"
                }}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="ml-2 flex-shrink-0">
                  <UserCircle className="rounded-full bg-blue-200 p-1 text-blue-700 h-8 w-8 shadow" />
                </div>
              )}
            </div>
          ))}
          <div ref={endOfChatRef} />
        </Card>
        <form
          className="flex gap-2 items-center"
          onSubmit={e => {
            e.preventDefault();
            if (!loading) sendMessage();
          }}
        >
          <Input
            type="text"
            autoFocus
            placeholder="Ask a technical question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 h-12 rounded-full bg-gray-100 border border-gray-300 focus:ring-blue-400"
          />
          <Button
            type="submit"
            className="h-12 px-6 rounded-full font-bold"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              "Send"
            )}
          </Button>
        </form>
        <div className="mt-4 text-xs text-gray-400 text-center select-none">
          <span>
            Powered by Google Gemini | Topics: IT, software, troubleshooting, devices, tech at work.
          </span>
        </div>
      </div>
    </MainLayout>
  );
}

