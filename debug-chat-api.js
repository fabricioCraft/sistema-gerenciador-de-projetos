
async function testChat() {
  console.log('Testing /api/chat...');
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say hello' }],
        projectId: 'debug-test'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers); // Note: might need iteration to see all

    if (!response.body) {
      console.log('No body');
      return;
    }

    // Node 22 fetch body is a ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      console.log('Chunk:', JSON.stringify(chunk));
    }
    console.log('Stream done');

  } catch (err) {
    console.error('Error:', err);
  }
}

testChat();
