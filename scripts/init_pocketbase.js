import PocketBase from 'pocketbase';
import 'dotenv/config';
import readline from 'readline';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

// Configuração do Projeto
const PROJECT_NAME = 'amar_acom_mulher_acoes_rast';
const PREFIX = `${PROJECT_NAME}_`;

// Schema inferido (corrigido para formato PB)
const SCHEMA = {
  users: {
    create: true,
    fields: []
  },
  [`${PREFIX}pacientes`]: {
    create: true,
    fields: [
      { name: 'name', type: 'text', required: true, options: {} },
      { name: 'cpf', type: 'text', required: true, options: {} },
      { name: 'birthDate', type: 'date', required: true, options: {} },
      { name: 'status', type: 'select', required: false, options: { values: ['Ativo', 'Pendente', 'Inativo'], maxSelect: 1 } },
      { name: 'lastExam', type: 'date', required: false, options: {} }
    ]
  },
  [`${PREFIX}exames`]: {
    create: true,
    fields: [
      // Relation fields usually need the target collection ID. 
      // During creation, if we use name, PB might resolve it if it exists.
      // But for safety, we might need to create the collection first, get its ID, then update.
      // However, PB allows using collection name in some contexts or we can use a placeholder.
      // For this script, we'll try using the name in collectionId.
      { name: 'patient', type: 'relation', required: false, options: { collectionId: `${PREFIX}pacientes`, cascadeDelete: true, maxSelect: 1 } },
      { name: 'type', type: 'text', required: true, options: {} },
      { name: 'requestedDate', type: 'date', required: false, options: {} },
      { name: 'requester', type: 'text', required: false, options: {} },
      { name: 'status', type: 'select', required: false, options: { values: ['Pendente', 'Concluído', 'Cancelado'], maxSelect: 1 } },
      { name: 'location', type: 'text', required: false, options: {} }
    ]
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('--- Iniciando Migração PocketBase ---');
  
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
      console.error('❌ Credenciais não encontradas no .env');
      process.exit(1);
  }

  try {
    try {
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Autenticado com sucesso (via _superusers)!');
    } catch (err) {
        if (err.status === 404) {
            console.log('⚠️ Endpoint _superusers não encontrado. Tentando endpoint antigo (admins)...');
            // Fallback for PB < 0.23
            try {
                // Manually authenticate using the old endpoint
                const authData = await pb.send('/api/admins/auth-with-password', {
                    method: 'POST',
                    body: { identity: email, password: password }
                });
                // Manually save the token to the store
                pb.authStore.save(authData.token, authData.admin);
                console.log('✅ Autenticado com sucesso (via admins)!');
            } catch (fallbackErr) {
                console.error('❌ Falha na autenticação fallback:', fallbackErr.originalError || fallbackErr.message);
                throw fallbackErr;
            }
        } else {
            throw err;
        }
    }

    // 1. Configurar Coleção de Usuários
    try {
        await pb.collections.getOne('users');
        console.log('ℹ️ Coleção users já existe.');
    } catch (e) {
        console.log('⚠️ Erro ao buscar users (inesperado).');
    }

    // 2. Criar/Atualizar Coleções Customizadas
    for (const [key, config] of Object.entries(SCHEMA)) {
        if (key === 'users') continue;

        try {
            await pb.collections.getFirstListItem(`name="${key}"`, { requestKey: null }).catch(() => null);
            // The above search is not correct for finding a collection definition.
            // We should use pb.collections.getOne(key) or list.
            // But getOne expects ID or Name.
            
            try {
                await pb.collections.getOne(key);
                console.log(`ℹ️ Coleção ${key} já existe.`);
            } catch(e) {
                 if (e.status === 404) {
                    console.log(`Creating collection ${key}...`);
                    
                    // Pre-processing for relation fields
                    const finalFields = [...config.fields];
                    for (const field of finalFields) {
                        if (field.type === 'relation' && field.options.collectionId && !field.options.collectionId.match(/^[a-z0-9]{15}$/)) {
                            // It looks like a name, try to find the ID
                            try {
                                const relCollection = await pb.collections.getOne(field.options.collectionId);
                                console.log(`🔄 Resolvendo ID para relação ${field.name}: ${field.options.collectionId} -> ${relCollection.id}`);
                                field.options.collectionId = relCollection.id;
                            } catch (e) {
                                console.warn(`⚠️ Não foi possível resolver ID para coleção ${field.options.collectionId}. Pode falhar se a API exigir ID.`);
                            }
                        }
                    }

                    await pb.collections.create({
                        name: key,
                        type: 'base',
                        schema: finalFields
                    });
                    console.log(`✅ Coleção ${key} criada!`);
                 } else {
                     throw e;
                 }
            }

        } catch (e) {
            console.error(`Erro ao processar ${key}:`, e.data || e.message);
        }
    }

  } catch (err) {
    console.error('❌ Erro Fatal:', err.originalError || err.message);
  } finally {
    rl.close();
  }
}

main();
