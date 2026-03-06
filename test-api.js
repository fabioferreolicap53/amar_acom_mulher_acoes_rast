const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJobzA1ajhseXRlejdjOHEiLCJleHAiOjE3NzQwMTIwNTMsImlkIjoiNmg3NG5jMGY2amx3c2k0IiwidHlwZSI6ImF1dGhSZWNvcmQifQ.IjbJzAZ8k32wvzI0Cm_7lwaaSzBBESbQSeAKNNEdLjI';
const url = 'http://localhost:5173/api/pacientes?unidade=CF%20EDSON%20ABDALLA%20SAAD&equipe=PRACA%20DO%20MAIA&microArea=1';

async function test() {
    try {
        console.log('Fazendo requisição para:', url);
        const response = await fetch(url, {
            headers: {
                'Authorization': token
            }
        });
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        const text = await response.text();
        console.log('Body (first 1000 chars):', text.substring(0, 1000));
    } catch (error) {
        console.error('Erro:', error);
    }
}

test();