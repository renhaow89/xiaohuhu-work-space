import { JournalModule } from '../modules/journal.js';

export const JournalPanel = {
    container: null,

    init(container) {
        this.container = container;
        this.render();
    },

    async render() {
        const journals = await JournalModule.list();

        this.container.innerHTML = `
            <div class="journal-box">
                <textarea id="journal-input" placeholder="记录今天的工作、实验、想法..."></textarea>
                <button id="save-journal">保存记录</button>
                <div class="journal-list">
                    ${journals.map(j => `
                        <div class="journal-item">
                            <strong>${j.date}</strong>
                            <p>${j.content}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.container.querySelector('#save-journal')
            .addEventListener('click', async () => {
                const input = this.container.querySelector('#journal-input');
                if (!input.value.trim()) return;

                await JournalModule.create({
                    content: input.value
                });

                input.value = '';
                await this.render();
            });
    }
};
