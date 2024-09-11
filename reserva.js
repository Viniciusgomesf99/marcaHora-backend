import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
const List = require('./models/List');

mongoose.connect('mongodb://localhost:27017/marcaHora', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
});

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Backend funcionando!');
});

// Rota para criar a lista
app.post('/create-list', async (req, res) => {
  const { name, daysAndTimes, allowMultipleSelections, allowMultipleBookings, maxSelectionsPerPerson, password } = req.body;

  const maxReservationsPerTime = allowMultipleBookings ? Infinity : maxSelectionsPerPerson || 1;

  const newList = new List({
    id: uuidv4(),
    name,
    password, 
    daysAndTimes: {},
    allowMultipleSelections,
    allowMultipleBookings,
    maxSelectionsPerPerson,
  });

  // Preenche os horários disponíveis
  for (const [day, times] of Object.entries(daysAndTimes)) {
    newList.daysAndTimes[day] = times.map(time => ({ time, remaining: maxReservationsPerTime, reservedBy: [] }));
  }

  try {
    await newList.save();  // Salva a lista no MongoDB
    console.log("Nova lista criada:", newList);
    res.status(201).send({ message: 'Lista criada com sucesso!', list: newList });
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    res.status(500).send({ message: 'Erro ao criar lista.' });
  }
});

// Rota para acessar a lista com senha
app.post('/access-list', async (req, res) => {
  const { listId, password } = req.body;

  try {
    const list = await List.findOne({ id: listId });

    if (!list) {
      return res.status(404).send({ message: 'Lista não encontrada.' });
    }

    if (list.password !== password) {
      return res.status(403).send({ message: 'Senha incorreta.' });
    }

    res.send({ message: 'Acesso permitido.', list });
  } catch (error) {
    console.error('Erro ao acessar a lista:', error);
    res.status(500).send({ message: 'Erro ao acessar a lista.' });
  }
});

// Rota para reservar um horário
app.post('/reserve-time', async (req, res) => {
  const { listId, day, time, userName } = req.body;

  try {
    const list = await List.findOne({ id: listId });

    if (!list) {
      return res.status(404).send({ message: 'Lista não encontrada.' });
    }

    const timeSlot = list.daysAndTimes.get(day).find(t => t.time === time);

    if (timeSlot.reservedBy.includes(userName)) {
      return res.status(400).send({ message: 'Você já reservou esse horário.' });
    }

    if (timeSlot.remaining > 0) {
      if (!list.allowMultipleBookings && timeSlot.reservedBy.length > 0) {
        return res.status(400).send({ message: 'Horário já reservado por outro usuário.' });
      }

      timeSlot.remaining -= 1;
      timeSlot.reservedBy.push(userName);

      if (timeSlot.remaining === 0) {
        list.daysAndTimes.set(day, list.daysAndTimes.get(day).filter(t => t.time !== time));
      }

      await list.save();

      return res.send({ message: `Horário ${time} reservado por ${userName}` });
    } else {
      return res.status(400).send({ message: 'Horário já atingiu o limite de reservas ou não está disponível.' });
    }
  } catch (error) {
    console.error('Erro ao reservar horário:', error);
    res.status(500).send({ message: 'Erro ao processar a reserva.' });
  }
});

app.get('/view-list/:id', (req, res) => {
  const listId = req.params.id;
  const foundList = lists.find(list => list.id === listId);

  // Verificando se a lista foi encontrada
  console.log("Lista encontrada para o ID:", listId, foundList);

  if (foundList) {
    res.send({ list: foundList });
  } else {
    res.status(404).send({ message: 'Lista não encontrada.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});