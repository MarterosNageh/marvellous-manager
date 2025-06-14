
import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const EDGE_URL =
  "https://venxltsumlixfgysffqu.functions.supabase.co/technical-chatbot";

export default function TechnicalChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const nextMessages = [
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

      const { text } = await res.json();
      setMessages([...nextMessages, { role: "model", content: text }]);
    } catch (err: any) {
      setMessages([
        ...nextMessages,
        {
          role: "model",
          content:
            "Sorry, there was a problem getting a response. Please try again.",
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
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="font-bold text-3xl mb-4 text-center">
        Technical Topics Chatbot
      </h1>
      <Card className="h-[440px] overflow-y-auto p-4 flex flex-col gap-2 bg-white mb-4 border border-gray-300 shadow-sm">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center my-auto">
            Ask me a technical question!
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}>
            <div
              className={`rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-100 text-right"
                  : "bg-gray-100 text-left"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={endOfChatRef} />
      </Card>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask a technical question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? <Loader className="animate-spin h-4 w-4" /> : "Send"}
        </Button>
      </div>
      <div className="mt-2 text-xs text-gray-400 text-center">
        Only technical topics are supported!
      </div>
    </div>
  );
}
