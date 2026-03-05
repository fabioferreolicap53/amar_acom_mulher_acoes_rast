import PocketBase from 'pocketbase';
import 'dotenv/config';

const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

async function main() {
  console.log(`--- 🛡️ Ajustando Permissões em ${pbUrl} ---`);
  
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

    // 1. Ajustar Coleção de Usuários
    const usersId = 'ho05j8lytez7c8q';
    console.log(`⚙️ Atualizando regras da coleção de usuários (${usersId})...`);
    await pb.collections.update(usersId, {
        listRule: "id = @request.auth.id",
        viewRule: "id = @request.auth.id",
        createRule: "", // Permite cadastro público
        updateRule: "id = @request.auth.id",
        deleteRule: "id = @request.auth.id",
    });
    console.log('✅ Regras de usuários atualizadas!');

    // 2. Ajustar Coleção de Registros de Exames
    const examesId = 'm5ntb2svycgounh';
    console.log(`⚙️ Atualizando regras da coleção de exames (${examesId})...`);
    await pb.collections.update(examesId, {
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''", // Permite qualquer usuário logado criar
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });
    console.log('✅ Regras de exames atualizadas!');

    console.log('\n🚀 SUCESSO! O sistema agora deve permitir cadastros e registros.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.data) console.error('Detalhes:', JSON.stringify(err.data));
  }
}

main();
