import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

interface ModuleContext {
  moduleName: string;
  subjectName: string;
  subjectCode: string;
  unitName: string;
  topics: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-chatbot`;

async function streamChat({
  messages,
  moduleContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  moduleContext: ModuleContext;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, moduleContext }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Request failed' }));
    onError(err.error || 'Something went wrong');
    return;
  }
  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

export default function StudentChatbot({ moduleContext }: { moduleContext: ModuleContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, []);

  useEffect(() => { if (open) { scrollToBottom(); inputRef.current?.focus(); } }, [open, scrollToBottom]);
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let assistantText = '';
    const allMessages = [...messages, userMsg];

    await streamChat({
      messages: allMessages,
      moduleContext,
      onDelta: (chunk) => {
        assistantText += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
          }
          return [...prev, { role: 'assistant', content: assistantText }];
        });
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err}` }]);
        setLoading(false);
      },
    });
  };

  const quickActions = [
    { label: '🧠 Mind Map', prompt: `Generate a mind map for the topic: ${moduleContext.moduleName}. Cover: ${moduleContext.topics.join(', ')}` },
    { label: '📝 Summary', prompt: `Give a structured summary of: ${moduleContext.moduleName}` },
  ];

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-5 right-5 z-50 w-[360px] h-[500px] flex flex-col shadow-2xl border rounded-2xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm">Study Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef as any}>
        <div ref={scrollRef} className="space-y-3 overflow-y-auto h-full">
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <Sparkles className="h-10 w-10 mx-auto text-primary opacity-60" />
              <p className="text-sm text-muted-foreground">Ask me anything about<br /><strong>{moduleContext.moduleName}</strong></p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map(a => (
                  <Button key={a.label} variant="outline" size="sm" className="text-xs" onClick={() => send(a.prompt)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-3 py-2 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask a question..."
          className="flex-1 text-sm bg-transparent border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          disabled={loading}
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => send()} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
