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
  password: {
    type: String, // Se você precisar de senha para acesso à lista
  },
  daysAndTimes: {
    type: Map,
    of: [
      {
        time: String,
        remaining: Number,
        reservedBy: [String] // Lista de usuários que reservaram este horário
      }
    ],
    required: true,
  },
  allowMultipleSelections: {
    type: Boolean,
    default: false,
  },
  allowMultipleBookings: {
    type: Boolean,
    default: false,
  },
  maxSelectionsPerPerson: {
    type: Number,
    default: 1, // Valor padrão de 1 caso não seja especificado
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Criando o modelo List
const List = mongoose.model('List', listSchema);

export default List;