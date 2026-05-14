import { useCallback, useEffect, useState } from 'react';
import socket from '../services/socket';
import { fetchChatHistory, fetchChatResponse } from '../services/chatApi';

const BOT_ID = 'snoutbot';
const BOT_USER = {
    _id: BOT_ID,
    name: 'SnoutBot',
    avatar: require('../../assets/images/snoutbot-ai.png'),
};

export interface ChatMessage {
    _id: string | number;
    text: string;
    createdAt: Date;
    user: { _id: string | number; name?: string; avatar?: any };
}

export const useChatbot = (utenteId: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        socket.on('bot_typing', (data: { isTyping: boolean }) => {
            setIsTyping(data.isTyping);
        });
        return () => { socket.off('bot_typing'); };
    }, [utenteId]);

    const initChat = async (welcomeMessage: string) => {
        const welcome: ChatMessage = { _id: 'welcome', text: welcomeMessage, createdAt: new Date(), user: BOT_USER };
        setMessages([welcome]);
        try {
            const storico = await fetchChatHistory();
            if (storico.length > 0) {
                const mappati: ChatMessage[] = storico.map((m) => ({
                    _id: m.id,
                    text: m.content,
                    createdAt: new Date(),
                    user: m.role === 'assistant' ? BOT_USER : { _id: 'me' },
                }));
                setMessages([welcome, ...mappati.reverse()]);
            }
        } catch {}
    };

    const sendMessage = useCallback(async (newMessages: ChatMessage[] = []) => {
        const userMsg = newMessages[0];
        if (!userMsg) return;

        setMessages(prev => [userMsg, ...prev]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await fetchChatResponse(userMsg.text);
            const botMessage: ChatMessage = {
                _id: Date.now().toString(),
                text: response || 'Bau... scusa, mi sono distratto. Puoi ripetere? 🐾',
                createdAt: new Date(),
                user: BOT_USER,
            };
            setMessages(prev => [botMessage, ...prev]);
        } catch {
            setMessages(prev => [{
                _id: Date.now().toString(),
                text: 'Ops, qualcosa è andato storto. Riprova 🐾',
                createdAt: new Date(),
                user: BOT_USER,
            }, ...prev]);
        } finally {
            setIsTyping(false);
        }
    }, []);

    return { messages, sendMessage, isTyping, initChat, inputValue, setInputValue };
};
