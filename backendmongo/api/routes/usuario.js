import express from 'express'
import {connectToDatabase} from '../utils/mongodb.js'
import {check, validationResult} from 'express-validator'
import bcrypt from 'bcryptjs/dist/bcrypt.js'
import jwt from 'jsonwebtoken'
import auth from '../middleware/auth.js'

const router = express.Router()
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'usuarios'

/* 
* VALIDAÇÕES DO USUÁRIO
*/
const validaUsuario = [
    check('nome')
    .not().isEmpty().withMessage('É obrigatório informar o nome')
    .isAlpha('pt-BR', {ignore: ' '}).withMessage('Informe apenas texto')
    .isLength({min: 3}).withMessage('Informe no mínimo 3 caracteres')
    .isLength({max: 100}).withMessage('Informe no máximo 100 caracteres'),
    check('email')
    .not().isEmpty().trim().withMessage('É obrigatorio informar o email')
    .isLowercase().withMessage('Não são permitidas maiúsculas')
    .isEmail().withMessage('Informe um email válido')
    .custom((value, {req})=> {
        return db.collection(nomeCollection).find({email: {$eq: value}}).toArray().then((email) => {
                //verifica se não existe o ID para garantir que é inclusão
                if (email.length && !req.params.id) {
                    return Promise.reject(`o email ${value} já existe!`)
                }
               })
    }),
    check('senha')
    .not().isEmpty().trim().withMessage('A senha é obrigatória')
    .isLength({min:6}).withMessage('A senha deve ter no mínimo 6 carac.')
    .isStrongPassword({
        minLength: 6,
        minLowercase: 1, minUppercase: 1,
        minSymbols: 1, minNumbers: 1
    }).withMessage('A senha não é segura. Informe no mínimo 1 caractere maiúsculo, 1 minúsculo, 1 numero e 1 caractere especial'),
    check('ativo')
    .default(true)
    .isBoolean().withMessage('O valor deve ser um booleano'),
    check('tipo')
    .default('Cliente')
    .isIn(['Admin','Cliente']).withMessage('O tipo deve ser Admin ou Cliente'),
    check('avatar')
    .optional({nullable: true})
    .isURL().withMessage('A URL do avatar é inválida')
]

//POST de usuário
router.post('/', validaUsuario, async(req, res) => {
const schemaErrors = validationResult(req)
if(!schemaErrors.isEmpty()) {
    return res.status(403).json({
        errors: schemaErrors.array()
    })
} else {
    //definindo o avatar default
    req.body.avatar = `https://ui-avatars.com/api/${req.body.nome.replace(/ /g,'+')}&background=F00&color=FFF`
    //criptografia da senha
    //genSalt => impede que 2 senhas iguais tenham resultados iguais
    const salt = await bcrypt.genSalt(10)
    req.body.senha = await bcrypt.hash(req.body.senha, salt)
    //iremos salvar o registro
    await db.collection(nomeCollection)
          .insertOne(req.body)
          .then(result => res.status(201).send(result))
          .catch(err => res.status(400).json(err))
} //fecha o else
})

// GET Usuário
router.get('/', auth, async(req, res)=> {
    try{
        const docs = []
        await db.collection(nomeCollection)
        .find({},{projection: {senha: false}})
        .sort({nome:1})
        .forEach((doc)=> {
            docs.push(doc)
        })
        res.status(200).json(docs)
    } catch (err){
        res.status(500).json({
            message: 'Erro ao obter a listagem dos usuários',
            error: `${err.message}`
        })
    }
})

const validaLogin = [
    check('email')
        .not().isEmpty().trim().withMessage('O e-mail é obrigatório')
        .isEmail().withMessage('Informe um e-mail válido para o login'),
    check('senha')
        .not().isEmpty().trim().withMessage('A senha é obrigatória')
]

router.post('/login', validaLogin, async(req, res)=> {
    const schemaErrors = validationResult(req)
    if(!schemaErrors.isEmpty()){
        return res.status(403).json(({errors: schemaErrors.array()}))
    }
    //obtendo os dados para o login
    const {email, senha} = req.body
    try{
        //verificar se o email existe no Mongodb
        let usuario = await db.collection(nomeCollection)
        .find({email}).limit(1).toArray()
        //Se o array estiver vazio, o email não existe
        if (!usuario.length)
            return res.status(404).json({
                value: `${email}`,
                msg: `O email ${email} não está cadastrado!`,
                param: `email`
            })
        //Se o email existir, comparamos se a senha está correta
        const isMatch = await bcrypt.compare(senha, usuario[0].senha)
        if (!isMatch)
            return res.status(403).json({
                errors: [{
                    value: 'senha',
                    msg: 'A senha informada está incorreta',
                    param: 'senha'
                }]
            })
        //iremos gerar o token JWT
        jwt.sign(
            {usuario: {id: usuario[0]._id}}, 
            process.env.SECRET_KEY,
            {expiresIn: process.env.EXPIRES_IN},
            (err, token) => {
                if (err) throw err
                res.status(200).json({
                    access_token: token
                })
            }
        )
    } catch (e){
        console.error(e)
    }
})
export default router