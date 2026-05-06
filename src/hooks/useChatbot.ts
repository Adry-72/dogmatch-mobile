import { useCallback, useEffect, useState } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import socket from '../services/socket';
import { fetchChatResponse } from '../services/chatApi';

const BOT_USER = { _id: 'dogbot', name: 'DogBot', avatar: undefined };

export const useChatbot = (utenteId: string) => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    useEffect(() => {
        socket.on('bot_typing', (data: { isTyping: boolean }) => {
            setIsTyping(data.isTyping);
        });

        return () => {
            socket.off('bot_typing');
        };
    }, [utenteId]);

    const initChat = (welcomeMessage: string) => {
        setMessages([
            {
                _id: 1,
                text: welcomeMessage,
                createdAt: new Date(),
                user: BOT_USER,
            },
        ]);
    };

    const sendMessage = useCallback(async (newMessages: IMessage[] = []) => {
        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessages)
        );

        const userText = newMessages[0].text;

        try {
            const response = await fetchChatResponse(userText);

            const botMessage: IMessage = {
                _id: Date.now().toString(),
                text: response || 'Bau... scusa, mi sono distratto. Puoi ripetere? 🐾',
                createdAt: new Date(),
                user: BOT_USER,
            };

            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, [botMessage])
            );
        } catch {
            setIsTyping(false);
        }
    }, []);

    return { messages, sendMessage, isTyping, initChat };
};
