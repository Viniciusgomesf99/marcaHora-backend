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
  id: String,
  name: String,
  password: String,
  items: Array
});

// Criando o modelo List
const List = mongoose.model('List', listSchema);

export default List;