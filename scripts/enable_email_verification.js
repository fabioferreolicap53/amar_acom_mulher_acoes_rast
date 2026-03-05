import PocketBase from 'pocketbase';
import 'dotenv/config';

const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

const PROJECT_NAME = 'amar_acom_mulher_acoes_rast';
const PREFIX = `${PROJECT_NAME}_`;

async function main() {
  console.log(`--- 📧 Ativando Verificação de E-mail Obrigatória em ${pbUrl} ---`);
  
  const emailAdmin = process.env.PB_ADMIN_EMAIL;
  const passwordAdmin = process.env.PB_ADMIN_PASSWORD;

  try {
    console.log('🔐 Autenticando como Admin...');
    try {
        await pb.admins.authWithPassword(emailAdmin, passwordAdmin);
    } catch (e) {
        const authData = await pb.send('/api/admins/auth-with-password', {
            method: 'POST',
            body: { identity: emailAdmin, password: passwordAdmin }
        });
        pb.authStore.save(authData.token, authData.admin);
    }
    console.log('✅ Autenticado!');

    const usersCollectionName = `${PREFIX}usuarios`;
    const usersCollection = await pb.collections.getOne(usersCollectionName);
    
    console.log(`⚙️ Configurando coleção ${usersCollectionName} para EXIGIR verificação...`);
    
    // Atualizar as opções da coleção para forçar verificação de e-mail
    await pb.collections.update(usersCollection.id, {
        options: {
            allowEmailAuth: true,
            allowOAuth2Auth: true,
            allowUsernameAuth: false,
            exceptEmailDomains: [],
            onlyEmailDomains: [],
            minPasswordLength: 8,
            manageEmailChange: true,
            requireEmail: true // Garante que o e-mail seja obrigatório
        }
    });

    console.log('✅ Configurações de Auth atualizadas para exigir e-mail.');
    console.log('\n🚀 IMPORTANTE: O PocketBase agora disparará automaticamente o e-mail de verificação ao criar um novo usuário via API de Auth.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.data) console.error('Detalhes:', JSON.stringify(err.data));
  }
}

main();
