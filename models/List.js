import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carregando as variáveis de ambiente do arquivo .env
dotenv.config();

// Conectando ao MongoDB usando a variável de ambiente
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch((error) => {
  console.error('Erro ao conectar ao MongoDB:', error);
});

// Definindo o esquema da lista
const listSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: String, // Se necessário
  daysAndTimes: {
    type: Map,
    of: [
      {
        time: String,
        remaining: Number,
        reservedBy: [String] // Array de nomes dos usuários que reservaram
      }
    ],
    required: true,
  },
  allowMultipleSelections: Boolean,
  allowMultipleBookings: Boolean,
  maxSelectionsPerPerson: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Criando o modelo List
const List = mongoose.model('List', listSchema);

export default List;