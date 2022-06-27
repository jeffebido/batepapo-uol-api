import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

/* Configurações Iniciais */
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());



/* Conexão com banco */
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect(() => {
    db = mongoClient.db("uol_api");
});



/* ------- ROTAS -------*/

app.post('/participants', async (req, res) => {
    
    /* ------- SCHEMAS  -------*/
    const schema = joi.object({
        name: joi.string().required()
    });


    const validate = schema.validate(req.body, { abortEarly: true });
    
    if (validate.error) {//Checa validações
        res.status(422).send("O campo não pode estar vazio");
        return;
    }
 
    try {
        const participants = await db.collection('participants').findOne(req.body);//Procura participante no bd

        if (participants) { //Verifica se usuário já existe
            res.status(409).send('Usuário já existe');
        }else{


            /* Salva Participante no bd*/
            await db.collection('participants').insertOne({
                name: req.body.name,
                lastStatus: Date.now()
            });

            /* Salva Mensagem no bd*/
            await db.collection('messages').insertOne({
                from: req.body.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs().format('HH:MM:ss')
            });

            res.status(201).send();
        }


    } catch(error) {
        console.log(error);
    }

   
});

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection('participants').find().toArray();//Busca lista de participantes no bd

        res.send(participants);
    } catch(error) {
           console.log(error);
    }
});

app.post('/messages', async (req, res) => {

    /* ------- SCHEMAS  -------*/

    const schema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });

    const validate = schema.validate(req.body, { abortEarly: true });
    
    if (validate.error) {//Checa validações
        res.status(422).send("O campo não pode estar vazio");
        return;
    }

    if (req.body.type != 'private_message' || req.body.type != 'message'){
        res.status(422).send("Campo type incorreto");
        return;
    }
    
    try {
        const from = await db.collection('participants').findOne( req.header('User') );//Procura participante no bd

        if (from) { //Verifica se usuário já existe
            res.status(422).send('Usuário não encontrado');
        }else{


         
            /* Salva Mensagem no bd*/
            await db.collection('messages').insertOne({
                from: req.header('User'),
                to: req.body.to,
                text: req.body.text,
                type: req.body.type,
                time: dayjs().format('HH:MM:ss')
            });

            res.status(201).send();
        }


    } catch(error) {
        console.log(error);
    }

});

app.get('/messages', async (req, res) => {

    const user = req.header('User');
    const limit = req.query.limit;

    try {
        const messages = await db.collection('messages').find({ $or: [ { to: 'Todos' }, { to: user }, { from: user }, { type: 'message' } ] }).toArray();//Busca lista de MENSAGENS no bd



        if(limit){
            res.send(messages.slice( 0 , limit ));//Limita mensagens
        }else{
            res.send(messages);
        }
    } catch(error) {
        console.log(error);
    }
});

app.post('/status', async (req, res) => {



    try {
        const user = await db.collection('participants').findOne({ name: req.header('User') });//Procura participante no bd

        if (user) { //Verifica se usuário já existe
            
            await db.collection('participants').updateOne( { name: req.header('User') }, { $set: { lastStatus: Date.now() } });
            res.sendStatus(200);
        }else{

            res.status(404).send();
        }


    } catch(error) {
        console.log(error);
    }
});

export async function checkUsersStatus(){


    try {
        const inactiveUsers = await db.collection('participants').find({ lastStatus: { $lte: Date.now() - 10000 } }).toArray();

        inactiveUsers.forEach(async (user) => {

            await db.collection('participants').deleteOne({
                name: user.name,
            });

            await db.collection('messages').insertOne({
                from: user.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format('HH:MM:ss'),
            });
        });

    } catch (error) {
        console.log(error);
    }
}

setInterval(checkUsersStatus, 15000);


app.listen(5000, '127.0.0.1');