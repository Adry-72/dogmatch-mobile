import api from './api';

export const fetchChatResponse = async (userMessage: string): Promise<string> => {
    const response = await api.post('/chat/bot', { message: userMessage });
    return response.data?.data?.text ?? '';
};

export const fetchChatHistory = async (): Promise<{ id: number; role: string; content: string }[]> => {
    const response = await api.get('/chat/bot/history');
    return response.data?.messaggi ?? [];
};

export const clearChatHistory = async (): Promise<void> => {
    await api.delete('/chat/bot/history');
};
