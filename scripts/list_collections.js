import PocketBase from 'pocketbase';
import 'dotenv/config';

// Forçar URL padrão se não estiver definida
const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

async function main() {
    console.log(`--- 📋 Listando Coleções em ${pbUrl} ---`);
    
    const email = process.env.PB_ADMIN_EMAIL;
    const password = process.env.PB_ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Credenciais de Admin não encontradas no .env');
        process.exit(1);
    }

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
        console.log('✅ Autenticado!');

        const collections = await pb.collections.getFullList();
        console.log('\n--- 📂 COLLECTIONS FOUND ---');
        collections.forEach(c => {
            console.log(`[${c.id}] ${c.name} (${c.type})`);
        });
        console.log('----------------------------\n');

    } catch (e) {
        console.error('❌ Erro:', e.message);
    }
}

main();
