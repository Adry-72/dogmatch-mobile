import api from './api';

export const fetchChatResponse = async (userMessage: string): Promise<string> => {
    const response = await api.post('/chat/bot', { message: userMessage });
    return response.data?.data?.text ?? '';
};
