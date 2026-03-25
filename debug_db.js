const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bots = await prisma.bot.findMany({
      include: {
        interactions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('--- BOTS CONFIGURATION ---');
    bots.forEach(bot => {
      console.log(`ID: ${bot.id}`);
      console.log(`Token (prefix): ${bot.botToken.slice(0, 10)}...`);
      console.log(`Model: ${bot.aiModel}`);
      console.log(`Is Active: ${bot.isActive}`);
      console.log(`System Prompt: ${bot.systemPrompt}`);
      console.log(`Welcome Message: ${bot.welcomeMessage}`);
      console.log(`KB Length: ${bot.knowledgeBaseText?.length || 0}`);
      console.log(`KB Preview: ${bot.knowledgeBaseText?.slice(0, 200)}...`);
      console.log('Recent Interactions:');
      bot.interactions.forEach(i => {
        console.log(`  [${i.createdAt.toISOString()}] User: ${i.userInput} -> AI: ${i.aiResponse.slice(0, 100)}...`);
      });
      console.log('--------------------------');
    });
  } catch (error) {
    console.error('Error debugging DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
