// Journal Module
// Personal daily work log storage module

import { Storage } from '../core/storage.js';

export const JournalModule = {
    async create(entry) {
        const journals = await this.list();

        const item = {
            id: Date.now(),
            date: entry.date || new Date().toISOString().slice(0, 10),
            content: entry.content || '',
            createdAt: new Date().toISOString()
        };

        journals.push(item);
        await Storage.save('journals', journals);

        return item;
    },

    async list() {
        return await Storage.load('journals') || [];
    }
};
