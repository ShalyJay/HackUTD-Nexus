import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageToBot } from '../services/apiService';
import './Chatbot.css';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Send the initial welcome message
  useEffect(() => {
    const sendWelcome = async () => {
      setIsLoading(true);
      try {
        const botResponse = await sendMessageToBot("INITIATE_ONBOARDING", sessionIdRef.current);
        setMessages([{ role: 'assistant', content: botResponse }]);
      } catch (error) {
        setMessages([{ role: 'error', content: "Failed to connect to the bot." }]);
      } finally {
        setIsLoading(false);
      }
    };
    sendWelcome();
  }, []);

  // Auto-scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev: Message[]) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const botResponse = await sendMessageToBot(userMessage, sessionIdRef.current);
      setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      setMessages((prev: Message[]) => [...prev, { role: 'error', content: "Sorry, I'm having trouble connecting." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">Fintech Onboarding</div>
      <div className="chatbot-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message-row assistant">
            <div className="typing-indicator">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chatbot-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chatbot;