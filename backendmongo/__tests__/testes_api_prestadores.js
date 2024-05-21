/*
* Testes na API de Prestadores
* Tecnologias utilizadas:
* Supertest: Biblioteca para testes na API Rest no NodeJS
* dotenv: Biblioteca para gerenciar variáveis de ambiente 
 */
const request = require('supertest')
const dotenv = require('dotenv')
dotenv.config() //carrega as variáveis do .env

const baseURL = 'http://localhost:4001/api'

describe('API REST de Prestadores sem o Token', ()=>{
    it('GET / - Lista todos os prestadores sem o token', async()=>{
        const response = await request(baseURL)
        .get('/prestadores')
        .set('Content-Type', 'application/json')
        .expect(401)
    })

    it('GET / Obtém o Prestador pelo ID sem o token', async() => {
        const id = '65ef95a4cd35ad9b5a65427a'
        const response = await request(baseURL)
        .get(`/prestadores/id/${id}`)
        .set('Content-Type', 'application/json')
        .expect(401) //Unauthorized
    })

    it('GET / Obtém o Prestador pela razão sem o token', async() => {
        const razao = 'SERVIÇOS'
        const response = await request(baseURL)
        .get(`/prestadores/razao/${razao}`)
        .set('Content-Type', 'application/json')
        .expect(401) //Unauthorized
    })
})

describe('API REST de Prestadores com o token', ()=> {
    let token //Armazenaremos o access_token JWT
    it('POST - Autentucar usuário e senha para retornar token JWT', async() => {
        const senha = process.env.SENHA_USUARIO
        const response = await request(baseURL)
        .post('/usuarios/login')
        .set('Content-Type', 'application/json')
        .send({"email":"oi@bol.com.br", "senha":senha}) 
        .expect(200) //OK

        token = response.body.access_token
        expect(token).toBeDefined()// Recebemos o token?
    })

    it('GET - Listar os prestadores com autenticação', async() => {
        const response = await request(baseURL)
        .get('/prestadores')
        .set('Content-Type', 'application/json')
        .set('access-token', token) //inclui o token na chamada 
        .expect(200) //OK

        const prestadores = response.body
        expect(prestadores).toBeInstanceOf(Array)
    })

    dadosDoPrestador = {
        "cnpj": "78439823092676",
        "razao_social": "LAVANDA DE CRISTO",
        "cep": "13310160",
        "endereco": {
            "logradouro": "Av. Presidente Kennedy, 321",
            "complemento": "",
            "bairro": "Centro",
            "localidade": "Votorantim",
            "uf": "SP"
        },
        "cnae_fiscal": 451510,
        "nome_fantasia": "ZÉ JANAI2",
        "data_inicio_atividade": "2022-07-22",
        "localizacao": {
            "type": "Point",
            "coordinates": [-23.2904, -47.2963]
        }
    }

    it('POST - Inclui um novo prestador com autenticação', async() => {
        const response = await request(baseURL)
        .post('/prestadores')
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .send(dadosDoPrestador)
        .expect(201) //Created

        expect(response.body).toHaveProperty('acknowledged')
        expect(response.body.acknowledged).toBe(true)

        expect(response.body).toHaveProperty('insertedId')
        expect(typeof response.body.insertedId).toBe('string')
        idPrestadorInserido = response.body.insertedId
        expect(response.body.insertedId.length).toBeGreaterThan(0)
    })

    it('GET /:id - Lista o prestador pelo id com token', async()=> {
        const response = await request(baseURL)
        .get(`/prestadores/id/${idPrestadorInserido}`)
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .expect(200)
    })

    it('GET /:id - Lista o prestador pela razão com token', async()=> {
        const response = await request(baseURL)
        .get(`/prestadores/razao/${dadosDoPrestador.razao_social}`)
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .expect(200)
    })
})