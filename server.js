import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import List from './models/List.js'; // Certifique-se de incluir a extensão '.js'

const app = express();
const port = process.env.PORT || 3001;

// Configuração de CORS para permitir requisições do seu frontend
const corsOptions = {
  origin: 'https://marca-hora.vercel.app', // URL do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Aplicando o middleware de CORS
app.use(cors(corsOptions));

// Tratando as requisições `OPTIONS` (preflight request)
app.options('*', cors(corsOptions));

app.use(cors());
app.use(bodyParser.json());

const lists = [];

app.get('/', (req, res) => {
  res.send('Backend funcionando!');
});

app.post('/create-list', async (req, res) => {
  const { name, password, days, daysAndTimes, allowMultipleSelections, allowMultipleBookings, maxSelectionsPerPerson } = req.body;

  // Define o limite de reservas por horário com base no `maxSelectionsPerPerson`
  const maxReservationsPerTime = allowMultipleBookings ? Infinity : maxSelectionsPerPerson || 1;

  // Prepara o formato correto de `daysAndTimes`
  const formattedDaysAndTimes = {};

  for (const [day, times] of Object.entries(daysAndTimes)) {
    formattedDaysAndTimes[day] = times.map(time => ({ time, remaining: maxReservationsPerTime, reservedBy: [] }));
  }

  const newList = new List({
    id: uuidv4(),
    name,
    password,
    days,
    daysAndTimes: formattedDaysAndTimes,
    allowMultipleSelections,
    allowMultipleBookings,
    maxSelectionsPerPerson,
  });

  try {
    await newList.save();
    console.log("Nova lista criada:", newList);  // Log para verificação
    res.status(201).send({ message: 'Lista criada com sucesso!', list: newList });
  } catch (error) {
    console.error('Erro ao salvar a lista no MongoDB:', error);
    res.status(500).send({ message: 'Erro ao criar a lista.' });
  }
});

app.get('/view-list/:id', async (req, res) => {
  const listId = req.params.id;

  try {
    // Buscando a lista pelo campo `id` no MongoDB
    const foundList = await List.findOne({ id: listId });

    // Verificando se a lista foi encontrada
    console.log("Lista encontrada para o ID:", listId, foundList);

    if (foundList) {
      res.send({ list: foundList });
    } else {
      res.status(404).send({ message: 'Lista não encontrada.' });
    }
  } catch (error) {
    console.error('Erro ao buscar a lista no MongoDB:', error);
    res.status(500).send({ message: 'Erro ao buscar a lista.' });
  }
});

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

app.post('/end-list', async (req, res) => {
  const { listId, password } = req.body;

  try {
    const list = await List.findOne({ id: listId });

    if (!list) {
      return res.status(404).send({ message: 'Lista não encontrada.' });
    }

    if (list.password !== password) {
      return res.status(403).send({ message: 'Senha incorreta.' });
    }

    // Remove a lista do banco de dados
    await List.deleteOne({ id: listId });

    res.send({ message: 'Lista encerrada com sucesso.' });
  } catch (error) {
    console.error('Erro ao encerrar a lista:', error);
    res.status(500).send({ message: 'Erro ao encerrar a lista.' });
  }
});

app.post('/reserve-time', async (req, res) => {
  const { listId, day, time, userName } = req.body;

  try {
    // Buscar a lista no MongoDB
    const list = await List.findOne({ id: listId });

    if (list) {
      const userHasReservedThisTime = list.daysAndTimes[day].some(slot => slot.time === time && slot.reservedBy && slot.reservedBy.includes(userName));

      if (userHasReservedThisTime) {
        return res.status(400).send({ message: 'Você já reservou esse horário.' });
      }

      const timeSlot = list.daysAndTimes[day].find(t => t.time === time);

      if (timeSlot && timeSlot.remaining > 0) {
        if (!list.allowMultipleBookings && timeSlot.reservedBy && timeSlot.reservedBy.length > 0) {
          return res.status(400).send({ message: 'Horário já reservado por outro usuário.' });
        }

        timeSlot.remaining -= 1;

        if (!timeSlot.reservedBy) {
          timeSlot.reservedBy = [];
        }
        timeSlot.reservedBy.push(userName);

        if (timeSlot.remaining === 0) {
          list.daysAndTimes[day] = list.daysAndTimes[day].filter(t => t.time !== time);
        }

        // Salvar as alterações na lista no MongoDB
        await list.save();
        res.send({ message: `Horário ${time} reservado por ${userName}` });
      } else {
        res.status(400).send({ message: 'Horário já atingiu o limite de reservas ou não está disponível.' });
      }
    } else {
      res.status(404).send({ message: 'Lista não encontrada.' });
    }
  } catch (error) {
    console.error('Erro ao fazer a reserva:', error);
    res.status(500).send({ message: 'Erro ao fazer a reserva.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
})