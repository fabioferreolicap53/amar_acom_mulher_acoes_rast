import PocketBase from 'pocketbase';

const pb = new PocketBase('https://centraldedados.dev.br');

async function login() {
    try {
        const res = await pb.collection('amar_acom_mulher_acoes_rast_usuarios').authWithPassword('fabioferreoli.cap53@gmail.com', '@Cap5364125');
        console.log('Token:', res.token);
        console.log('User:', res.record);
    } catch (e) {
        console.error('Login failed:', e.message);
        if (e.data) {
            console.error('Data:', e.data);
        }
    }
}

login();