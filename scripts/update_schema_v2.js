import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
const PROJECT_NAME = 'amar_acom_mulher_acoes_rast';
const PREFIX = `${PROJECT_NAME}_`;

async function main() {
  console.log('--- Atualizando Schema (V2 - Híbrido) ---');
  
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
      console.error('❌ Credenciais não encontradas no .env');
      process.exit(1);
  }

  try {
    // Autenticação (com fallback)
    try {
        await pb.admins.authWithPassword(email, password);
    } catch (err) {
        const authData = await pb.send('/api/admins/auth-with-password', {
            method: 'POST',
            body: { identity: email, password: password }
        });
        pb.authStore.save(authData.token, authData.admin);
    }
    console.log('✅ Autenticado!');

    // 1. Buscar ou Criar Collection de Usuários do Projeto
    const usersCollectionName = `${PREFIX}usuarios`;
    console.log(`🔄 Gerenciando collection de usuários: ${usersCollectionName}...`);
    let usersCollection;

    try {
        const result = await pb.collections.getList(1, 1, { filter: `name="${usersCollectionName}"` });
        if (result.items.length > 0) {
            usersCollection = result.items[0];
            console.log(`✅ Collection ${usersCollectionName} encontrada: ${usersCollection.id}`);
        } else {
            console.log(`Creating ${usersCollectionName}...`);
            usersCollection = await pb.collections.create({
                name: usersCollectionName,
                type: 'auth', // Tipo AUTH
                schema: []
            });
            console.log(`✅ Collection ${usersCollectionName} criada!`);
        }

        // Adicionar campos customizados
        const newFields = [
            { name: 'unidade', type: 'text', required: false, options: {} },
            { name: 'equipe', type: 'text', required: false, options: {} },
            { name: 'micro_area', type: 'text', required: false, options: {} }
        ];
        
        const existingNames = new Set(usersCollection.schema.map(f => f.name));
        let changed = false;
        const newSchema = [...usersCollection.schema];

        for (const f of newFields) {
            if (!existingNames.has(f.name)) {
                newSchema.push(f);
                changed = true;
            }
        }

        if (changed) {
            await pb.collections.update(usersCollection.id, { schema: newSchema });
            console.log(`✅ ${usersCollectionName} atualizada com campos de controle.`);
        }
    } catch (e) {
        console.error(`❌ Erro em ${usersCollectionName}:`, e.message);
    }

    if (!usersCollection) {
        console.error('❌ Abortando: Falha ao obter collection de usuários.');
        process.exit(1);
    }

    // 2. Criar 'registros_exames'
    const collectionName = `${PREFIX}registros_exames`;
    
    try {
        const result = await pb.collections.getList(1, 1, { filter: `name="${collectionName}"` });
        
        if (result.items.length > 0) {
             console.log(`ℹ️ Coleção ${collectionName} já existe.`);
        } else {
            console.log(`Creating ${collectionName}...`);
            await pb.collections.create({
                name: collectionName,
                type: 'base',
                schema: [
                    { name: 'patient_id', type: 'text', required: true, options: {} },
                    { name: 'tipo_exame', type: 'text', required: true, options: {} },
                    { name: 'data_realizacao', type: 'date', required: true, options: {} },
                    { name: 'observacao', type: 'text', required: false, options: {} },
                    { name: 'usuario_id', type: 'relation', required: true, options: {
                        collectionId: usersCollection.id,
                        cascadeDelete: false,
                        maxSelect: 1
                    }}
                ]
            });
            console.log(`✅ Coleção ${collectionName} criada!`);
        }
    } catch (e) {
        console.error('Erro ao criar collection:', e);
    }

    // 3. Regras de API (Imprimir sugestão)
    console.log('\n--- 🔒 SUGESTÃO DE REGRAS DE API (Aplicar no Painel) ---');
    console.log(`Collection: ${collectionName}`);
    console.log(`List/View: @request.auth.id != "" && usuario_id = @request.auth.id  (Ou conforme regra de negócio)`);
    console.log(`Create: @request.auth.id != ""`);
    console.log(`Update/Delete: usuario_id = @request.auth.id`);
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

main();
