
import { test, expect } from '@playwright/test';

test('chat flow', async ({ page }) => {
  test.setTimeout(60000);

  // Listen to browser console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  // 1. Navigate directly to an existing project to save time
  // Using ID from logs: 0064386b-25b9-431d-91dd-24dcc3df6e8c
  // If this ID doesn't exist, the test will be redirected to home, and we'll have to create one.
  // We can handle that.
  
  const projectId = '0064386b-25b9-431d-91dd-24dcc3df6e8c';
  await page.goto(`http://localhost:3000/dashboard/${projectId}`);
  
  // Check if we were redirected to home (meaning project not found)
  if (page.url() === 'http://localhost:3000/') {
      console.log('Project not found, creating new one...');
      await page.click('text=Iniciar Novo Projeto');
      await expect(page.locator('text=Kickoff de Projeto com IA')).toBeVisible();
      await page.fill('textarea', 'Projeto de teste simples para verificar o chat.');
      await page.click('text=Gerar Plano');
      await page.waitForURL(/\/dashboard\/.+/, { timeout: 90000 });
  } else {
      console.log('Navigated to existing project dashboard');
  }

  // 2. Open Chat
  const chatButton = page.locator('button:has-text("Perguntar à Kira")');
  await expect(chatButton).toBeVisible();
  await chatButton.click();
  
  // 3. Send Message
  const input = page.getByPlaceholder('Digite sua mensagem para a Kira...');
  await expect(input).toBeVisible();
  await input.fill('Qual o próximo passo?');
  await page.keyboard.press('Enter');

  // 4. Verify User Message
  // Use a more specific selector to avoid matching the debug <pre> block
  const userMessageBubble = page.locator('.bg-blue-600.text-white').filter({ hasText: 'Qual o próximo passo?' });
  await expect(userMessageBubble).toBeVisible();

  // 5. Verify Assistant Response
  // The assistant bubble has: bg-slate-900 border border-slate-800 text-slate-200
  const assistantBubble = page.locator('.bg-slate-900.text-slate-200');
  
  // Wait for any text inside the assistant bubble that is not empty
  await expect(async () => {
    const count = await assistantBubble.count();
    expect(count).toBeGreaterThan(0);
    // Get text from the last bubble (most recent)
    const text = await assistantBubble.last().textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    console.log('Assistant bubble text:', text);
  }).toPass({ timeout: 30000 });
});
