import express, { Request, Response } from 'express'
import { v4 as uuidGenerator } from 'uuid'
import cors from 'cors'
import dotenv from 'dotenv'

import User from './User'
import Transaction from './Transaction'


const app = express()
dotenv.config()

const port = process.env.PORT || 8080

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors());

app.get('/user', (request: Request, response: Response) => {
    response.send('Hello world')
})

let users: Array<User> = []

app.post('/users', (request: Request, response: Response) => {
    const { name, email, cpf, age } = request.body;

    if (!name || !email || !cpf || !age ) {
        return response.json({
            mensagem: 'Dados inválidos'
        }).status(400)
    }
    
    const user = new User(name, cpf, email, age, [])

    users.push(user)
    
    return response.json({users})
})

app.get('/users/:id', (request: Request, response: Response) => {
    const { id } = request.params;
    
    const user = users.find(user => user.userId === id)
    if (!user) {
        return response.json({mensagem: 'Usuario não encontrado'}).status(404)
    }
    
    return response.json(user)
})

app.get('/users', (request: Request, response: Response) => {
    return response.json({users})
 }); 
 
app.put('/users/:id', (request: Request, response: Response) => {
    const { id } = request.params;
    const { name, email, age } = request.body;

    if (!name || !email || !age || !id) {
        return response.json({
            mensagem: 'Dados inválidos'
        }).status(400)
    }

    const user = users.find(user => user.userId === id)
    if (!user) {
        return response.json({mensagem: 'Usuario não encontrado'}).status(404)
    }
    
    user.name = name;
    user.email = email;
    user.age = age;
    user.transactions = []

    return response.json({user})
});

app.delete('/users/:id', (request: Request, response: Response) => {
    const { id } = request.params;

    const userIndex = users.findIndex(user => user.userId === id)
    if (userIndex < 0) {
        return response.json({mensagem: 'Usuario não encontrado'}).status(404)
    }

    users.splice(userIndex, 1)

    return response.sendStatus(204)
    
});

app.post('/user/:userId/transactions', (request: Request, response: Response) => {
    const { userId } = request.params;
    const { title, value, type } = request.body;

    if (!title || !value || !type || !userId) {
        return response.json({
            mensagem: 'Dados inválidos' 
        }).status(400)
    }

    if (type === 'income' || type === 'outcome') {
        const userIndex = users.findIndex(user => user.userId === userId)
        if (userIndex < 0) {
            return response.json({mensagem: 'Usuario não encontrado'}).status(404)
        }
        
        const transaction = new Transaction(title, Number(value), type)
        
        users[userIndex].addTransaction(transaction)
        
        return response.json(users[userIndex])
    } else {
        return response.json({mensagem: 'Tipo invalido'}).status(401)
    }
});

app.get('/user/:userId/transactions/:id', (request: Request, response: Response) => {
    const { userId, id } = request.params;

    if (!userId || !id) {
        return response.json({
            mensagem: 'Dados inválidos' 
        }).status(400)
    }

    const userIndex = users.findIndex(user => user.userId === userId)
    if (userIndex < 0) {
        return response.json({mensagem: 'Usuario não encontrado'}).status(404)
    }

    const transaction = users[userIndex].transactions.find(transaction => transaction.id === id)
    if (!transaction) {
        return response.json({mensagem: 'Transação não encontrada'}).status(404)
    }
    return response.json({ transaction });
});

app.get('/users/:userId/transactions', (request: Request, response: Response) => {
    const { userId } = request.params;

    const user = users.find(user => user.userId === userId)
    if (!user) {
        return response.json({mensagem: 'Usuario não encontrado'}).status(404)
    }
    
    const totalValueIncome = user.transactions.reduce((total: any, value) => {
        if(value.type === 'income'){
            return total + value.value
        } else {
            return total
        }
        
    }, 0);

    const totalValueOutcome = user.transactions.reduce((total: any, value) => {
        if(value.type === 'outcome'){
            return total + value.value
        }else {
            return total
        }
    }, 0);

    const totalCredito = totalValueIncome - totalValueOutcome

    return response.json({
                        trasactions: user.transactions, 
                        valorRetirada: totalValueIncome, 
                        valorEntrada: totalValueOutcome,
                        totalCredito
                        })
})

app.listen(port, () => {
    console.log('API rodando...');
});