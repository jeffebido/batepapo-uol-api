import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

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


});

app.get('/participants', async (req, res) => {


});

app.post('/messages', async (req, res) => {


});

app.get('/messages', async (req, res) => {


});

app.post('/status', async (req, res) => {


});

app.listen(5000, '127.0.0.1');