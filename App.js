import React, { useState, useEffect } from 'react';
import { View, Modal, TextInput, Button, FlatList, Text } from 'react-native';
import db from './services/sqlite/SQLiteDatabase';

const bloods = ['O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const doacao = {
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+','AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'O-': ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
}
const recebe = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+',  'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-','O-'],
  'O+': ['O-', 'O+'],
  'O-': ['O-']
}

export default function App() {
  const [name, setName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([])
  const [screen, setScreen] = useState(0)
  const [search, setSearch] = useState('')
  
  
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, blood TEXT)',
        [],
        () => {
          console.log('Tabela criada com sucesso')
        }, error => {
          console.log('Erro ao criar tabela: ', error)
        }
      );
    });
  }, []);

  const handleSave = () => {
    if(!bloods.includes(bloodType)) {
      setShowModal(true);
      return;
    }
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO users (name, blood) VALUES (?, ?)',
        [name, bloodType],
        (_, result) => {
          console.log('Registro cadastrado com sucesso! ID: ', result.insertId);
          setName('');
          setBloodType('');
          fetchUsers();
        }, 
        (_, error) => {
          console.log('Erro ao inserir na tabela: ', error);
        }
      );
    });
  };

  const fetchUsers = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users', 
        [],
        (_, result) => {
          const rows = result.rows;
          const userData = [];
          for(let i = 0; i < rows.length; i++) {
            userData.push(rows.item(i));
          }
          setUsers(userData);
        }, 
        (_, error) => {
          console.log('Erro ao consultar tabela: ', error);
        }        
      );
    });
  };

  const removeItem = id => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM users WHERE id = ?',
        [id],
        (_, result) => {
          const newUsers = users.filter(obj => obj.id != id)
          setUsers(newUsers);
          console.log('deletado com sucesso');
        }, 
        (_, err) => {
          console.log('erro ao excluir da tabela: ', err);
        }
      );
    });
  };

  const obterDoadores = id => {
    const usuario = users.filter((u) =>  {
      return u.id == id})[0]
    
    const pode_receber_de = recebe[usuario.blood]
    const doadores = users.filter(u => {
      if(u.id != id) {
        return pode_receber_de.includes(u.blood)
      }
    });
    return doadores;  
    
    
  }

  const obterParaQuemDoar = id => {
    const usuario = users.filter((u) =>  {
      return u.id == id})[0]
    
    const pode_doar_para = doacao[usuario.blood]
    const recebedores = users.filter(u => {
      if(u.id != id) {
        return pode_doar_para.includes(u.blood)
      }
    });
    return recebedores;  
  }

  useEffect(() => {
    fetchUsers();
  }, [])

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {screen === 0 ? (
        <View style={{ flex: 1, padding: 20 }}>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <TextInput
            style={{ flex: 1, marginRight: 10, padding: 5, borderColor: 'gray', borderWidth: 1 }}
            placeholder="Nome"
            value={name}
            onChangeText={text => setName(text)}/>
          <TextInput
            style={{ flex: 1, marginRight: 10, padding: 5, borderColor: 'gray', borderWidth: 1 }}
            placeholder="Tipo sanguineo"
            value={bloodType}
            onChangeText={text => setBloodType(text)}/>
            <Button title="Salvar" onPress={handleSave} />
            <Modal visible={showModal} animationType="slide" transparent={true}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                  <Text style={{ marginBottom: 20 }}>Tipo sanguíneo inválido!</Text>
                  <Button title="OK!" onPress={() => setShowModal(false)} />
                </View>
              </View>
            </Modal>        
              
        </View>

        <table style={{ fontFamily: 'Arial, sans-serif', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={styles.tableHeader}>ID</th>
                  <th style={styles.tableHeader}>Nome</th>
                  <th style={styles.tableHeader}>Tipo Sanguíneo</th>
                  <th style={styles.tableHeader}>Excluir</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  return (
                  <tr key={user.id}>
                    <td style={styles.tableCell}>{user.id}</td>
                    <td style={styles.tableCell}>{user.name}</td>
                    <td style={styles.tableCell}>{user.blood}</td>
                    <td style={styles.tableCellButtom}>
                      <Button title='Remover' onPress={() => removeItem(user.id)}/>
                    </td>
                 </tr> );
                })}
              </tbody>
          </table>  
          
          <Text style={{marginTop: "20px", marginBottom: "40px"}}>Pesquisa de quem pode doar/receber</Text>

          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <TextInput
              style={{ flex: 0, marginRight: 10, padding: 5, borderColor: 'gray', borderWidth: 1 }}
              placeholder="id a pesquisar"
              value={search}
              onChangeText={text => setSearch(text)}/>
              <Button title="Pesquisar" onPress={() => setScreen(1)} />
          </View>
        </View>
        
      ) : (
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{marginBottom:"20px"}}>De quem posso receber?</Text>

          <table style={{ fontFamily: 'Arial, sans-serif', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={styles.tableHeader}>ID</th>
                  <th style={styles.tableHeader}>Nome</th>
                  <th style={styles.tableHeader}>Tipo Sanguíneo</th>
                </tr>
              </thead>
              <tbody>
                {obterDoadores(search).map(user => {
                  return (
                    <tr key={user.id}>
                      <td style={styles.tableCell}>{user.id}</td>
                      <td style={styles.tableCell}>{user.name}</td>
                      <td style={styles.tableCell}>{user.blood}</td>
                   </tr> );
                })}
              </tbody>
          </table>  
              
          <Text style={{marginBottom:"20px"}}>Para quem posso doar?</Text>
          
          <table style={{ fontFamily: 'Arial, sans-serif', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={styles.tableHeader}>ID</th>
                  <th style={styles.tableHeader}>Nome</th>
                  <th style={styles.tableHeader}>Tipo Sanguíneo</th>
                </tr>
              </thead>
              <tbody>
                {obterParaQuemDoar(search).map(user => {
                  return (
                    <tr key={user.id}>
                      <td style={styles.tableCell}>{user.id}</td>
                      <td style={styles.tableCell}>{user.name}</td>
                      <td style={styles.tableCell}>{user.blood}</td>
                   </tr> );
                })}
              </tbody>
          </table>  

          <Button title='Voltar' onPress={() => setScreen(0)}/>

          
        </View>
      )}
    </View>
  );
}


const styles = {
  tableHeader: {
    padding: '10px',
    fontWeight: 'bold',
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    textAlign: 'center'
  },
};

