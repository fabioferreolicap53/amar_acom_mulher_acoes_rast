import PocketBase from 'pocketbase';
import 'dotenv/config';

const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

async function main() {
  console.log(`--- 🛡️ Investigando Collections em ${pbUrl} ---`);
  
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  try {
    console.log('🔐 Autenticando...');
    try {
        await pb.admins.authWithPassword(email, password);
    } catch (e) {
        const authData = await pb.send('/api/admins/auth-with-password', {
            method: 'POST',
            body: { identity: email, password: password }
        });
        pb.authStore.save(authData.token, authData.admin);
    }
    console.log('✅ Autenticado como Admin!');

    console.log('🔍 Listando todas as coleções...');
    const collections = await pb.collections.getFullList();
    
    collections.forEach(c => {
        console.log(`- [${c.id}] ${c.name} (${c.type})`);
        console.log(`  Rules: create="${c.createRule}", list="${c.listRule}"`);
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

main();
