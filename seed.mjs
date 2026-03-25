import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.bot.create({
    data: {
      botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      botUsername: 'test_edit_bot',
      ownerWallet: '0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      knowledgeBaseText: 'This is the old knowledge base.',
      systemPrompt: 'Old system prompt',
      welcomeMessage: 'Old welcome message',
      secretToken: 'dummy-secret-token'
    }
  });
  console.log('Seed data created');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
