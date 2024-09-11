import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://pachenkoKING:<db_password>@marcahora.zkhue.mongodb.net/marcaHora?retryWrites=true&w=majority&appName=marcaHora', {
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