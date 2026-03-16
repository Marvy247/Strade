// notifications
export type Notification = { id: string; type: string; message: string; read: boolean; createdAt: number; };
export function createNotification(type: string, message: string): Notification { return { id: crypto.randomUUID(), type, message, read: false, createdAt: Date.now() }; }
