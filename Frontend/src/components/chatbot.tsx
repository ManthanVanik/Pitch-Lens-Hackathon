'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisData } from '@/lib/types';
import { interviewStartup, StartupInterviewerInput } from '@/ai/flows/startup-interviewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, Bot } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function Chatbot({ analysisData }: { analysisData: AnalysisData }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getInitialBotMessage = async () => {
    setIsLoading(true);
    try {
      const initialInput: StartupInterviewerInput = {
        analysisData: JSON.stringify(analysisData),
        history: [],
      };
      const result = await interviewStartup(initialInput);
      setMessages([{ role: 'model', content: result.message }]);
    } catch (e) {
      setMessages([{ role: 'model', content: 'Sorry, I am having trouble starting the conversation. Please try refreshing.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInitialBotMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisData]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A hack to scroll to the bottom.
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await interviewStartup({
        analysisData: JSON.stringify(analysisData),
        history: newMessages,
      });
      setMessages((prevMessages) => [...prevMessages, { role: 'model', content: result.message }]);
    } catch (e) {
      setMessages((prevMessages) => [...prevMessages, { role: 'model', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3"><Bot className="w-7 h-7 text-primary"/>AI Analyst Chat</CardTitle>
        <CardDescription>Ask follow-up questions to get a deeper analysis of the startup.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'model' && (
                  <div className="bg-primary p-2 rounded-full text-primary-foreground">
                    <Bot size={20} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                    <div className="bg-accent p-2 rounded-full text-accent-foreground">
                        <User size={20} />
                    </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="bg-primary p-2 rounded-full text-primary-foreground">
                  <Bot size={20} />
                </div>
                <div className="bg-muted text-muted-foreground rounded-lg p-3 flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Type your answer..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
