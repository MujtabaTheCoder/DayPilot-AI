import { Platform } from 'react-native';
import { getDatabase, memoryStore, saveWebStore } from './database';
import { AssistantMessage } from './types';

function generateId(): string {
  return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export const AssistantRepo = {
  async getMessages(): Promise<AssistantMessage[]> {
    if (Platform.OS === 'web') {
      return [...memoryStore.assistantMessages].sort((a, b) => a.createdAt - b.createdAt);
    }

    const db = await getDatabase();
    if (!db) return [];

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM assistant_messages ORDER BY created_at ASC`
    );

    return rows.map((r) => ({
      id: r.id,
      sender: r.sender as 'user' | 'assistant',
      content: r.content,
      intent: r.intent ?? undefined,
      actionTaken: r.action_taken ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async addMessage(msg: Omit<AssistantMessage, 'id' | 'createdAt'>): Promise<AssistantMessage> {
    const newMessage: AssistantMessage = {
      ...msg,
      id: generateId(),
      createdAt: Date.now(),
    };

    if (Platform.OS === 'web') {
      memoryStore.assistantMessages.push(newMessage);
      await saveWebStore();
      return newMessage;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        `INSERT INTO assistant_messages (id, sender, content, intent, action_taken, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newMessage.id,
          newMessage.sender,
          newMessage.content,
          newMessage.intent ?? null,
          newMessage.actionTaken ?? null,
          newMessage.createdAt,
        ]
      );
    }
    return newMessage;
  },

  async clearHistory(): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore.assistantMessages = [];
      await saveWebStore();
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`DELETE FROM assistant_messages`);
    }
  },
};
