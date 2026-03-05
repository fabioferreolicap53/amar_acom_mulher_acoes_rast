import PocketBase from 'pocketbase';
import 'dotenv/config';

const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

const PROJECT_NAME = 'amar_acom_mulher_acoes_rast';
const PREFIX = `${PROJECT_NAME}_`;

async function main() {
  console.log(`--- 🔓 Ajustando Autenticação e Validando Usuário em ${pbUrl} ---`);
  
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
    
    // 1. Desabilitar verificação de e-mail obrigatória
    console.log(`⚙️ Configurando coleção ${usersCollectionName}...`);
    await pb.collections.update(usersCollection.id, {
        options: {
            allowEmailAuth: true,
            allowOAuth2Auth: true,
            allowUsernameAuth: false,
            exceptEmailDomains: [],
            onlyEmailDomains: [],
            minPasswordLength: 8,
            // Importante: garantir que verificação não impeça login se o servidor SMTP não estiver configurado
            manageEmailChange: true,
            requireEmail: true
        }
    });
    console.log('✅ Configurações de Auth atualizadas.');

    // 2. Validar manualmente o usuário criado (fabioferreoli.cap53@gmail.com)
    const targetEmail = 'fabioferreoli.cap53@gmail.com';
    console.log(`🔍 Buscando usuário ${targetEmail}...`);
    
    const userRecord = await pb.collection(usersCollectionName).getFirstListItem(`email="${targetEmail}"`);
    
    if (userRecord) {
        console.log(`✅ Usuário encontrado: ${userRecord.id}`);
        console.log(`🔄 Validando usuário (verified = true)...`);
        
        await pb.collection(usersCollectionName).update(userRecord.id, {
            verified: true,
            // Garantir que não está desabilitado
            disabled: false 
        });
        
        console.log(`🚀 SUCESSO! O usuário ${targetEmail} agora está validado e pronto para logar.`);
    } else {
        console.warn(`⚠️ Usuário ${targetEmail} não encontrado na coleção.`);
    }

    console.log('\n💡 DICA: Tente logar agora. Se o erro persistir, verifique se a senha digitada é a mesma do cadastro.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.data) console.error('Detalhes:', JSON.stringify(err.data));
  }
}

main();
