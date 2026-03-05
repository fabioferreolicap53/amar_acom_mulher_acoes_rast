import PocketBase from 'pocketbase';
import 'dotenv/config';

const pbUrl = process.env.PB_URL || process.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br';
const pb = new PocketBase(pbUrl);

async function main() {
  console.log(`--- 📧 Configurando Template de E-mail em ${pbUrl} ---`);
  
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;
  
  // URL local para desenvolvimento (Vite padrão)
  // Em produção, deve ser a URL do seu domínio (ex: https://amar-acom-mulher.pages.dev)
  // Atualizado para a URL de produção conforme solicitado
  const appUrl = 'https://amar-cap53.pages.dev';

  try {
    console.log('🔐 Autenticando como Admin...');
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

    console.log(`⚙️ Atualizando configurações globais do PocketBase...`);
    console.log(`   Nova App URL: ${appUrl}`);

    // Atualizar configurações
    await pb.settings.update({
        meta: {
            appName: 'Central de Dados', // Nome genérico
            appUrl: appUrl,
            senderName: 'Suporte Central de Dados', // Remetente genérico
            senderAddress: 'no-reply@centraldedados.dev.br', 
            
            // 1. Template de Verificação de E-mail
            verificationTemplate: {
                subject: 'Verifique seu e-mail',
                body: `<p>Olá,</p>
<p>Recebemos uma solicitação de cadastro.</p>
<p>Por favor, verifique seu e-mail clicando no link abaixo para ativar sua conta:</p>
<p>
  <a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Confirmar meu e-mail</a>
</p>
<p>Se você não solicitou este e-mail, pode ignorá-lo.</p>
<p>Atenciosamente,<br/>Equipe de Suporte</p>`,
                actionUrl: '{APP_URL}/gateway/verify?token={TOKEN}'
            },

            // 2. Template de Redefinição de Senha
            resetPasswordTemplate: {
                subject: 'Redefinição de senha',
                body: `<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
<p>Clique no botão abaixo para criar uma nova senha:</p>
<p>
  <a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Redefinir senha</a>
</p>
<p>Se você não solicitou a troca de senha, sua conta está segura e você pode ignorar este e-mail.</p>
<p>Atenciosamente,<br/>Equipe de Suporte</p>`,
                // Nota: O reset de senha também precisará passar pelo Gateway se quisermos redirecionar corretamente
                // Por enquanto, vamos manter apontando para o gateway de reset (que precisaremos criar ou adaptar)
                actionUrl: '{APP_URL}/gateway/verify?token={TOKEN}&type=password-reset'
            },

            // 3. Template de Confirmação de Troca de E-mail
            confirmEmailChangeTemplate: {
                subject: 'Confirme seu novo e-mail',
                body: `<p>Olá,</p>
<p>Recebemos uma solicitação para alterar o e-mail da sua conta.</p>
<p>Clique no botão abaixo para confirmar o novo endereço:</p>
<p>
  <a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Confirmar novo e-mail</a>
</p>
<p>Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.</p>
<p>Atenciosamente,<br/>Equipe de Suporte</p>`,
                actionUrl: '{APP_URL}/gateway/verify?token={TOKEN}&type=email-change'
            }
        }
    });

    console.log('✅ Configurações de E-mail atualizadas com sucesso!');
    console.log(`🔗 Os e-mails de verificação agora apontarão para: ${appUrl}/confirm-verification`);
    console.log('\n⚠️ NOTA: Como o PocketBase é compartilhado, isso afetará outros apps que usem a mesma instância.');
    console.log('   Para suportar múltiplos apps simultaneamente, considere usar um Gateway de Redirecionamento.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.data) console.error('Detalhes:', JSON.stringify(err.data));
  }
}

main();
