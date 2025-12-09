
const { streamText } = require('ai');
console.log('streamText type:', typeof streamText);
console.log('ai exports:', Object.keys(require('ai')));

async function check() {
    try {
        const result = await streamText({
            model: { provider: 'openai', modelId: 'gpt-4o-mini', doGenerate: async () => ({ text: 'hello', usage: {}, finishReason: 'stop' }) }, // Mock model?
            messages: [{ role: 'user', content: 'hi' }]
        });
    } catch (e) {
        // We expect this to fail without a real model provider, but we can check if we can mock it
        // Or just check if streamText returns a promise
    }
}
// actually difficult to mock model without full setup.
