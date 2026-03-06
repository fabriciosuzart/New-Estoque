import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const q = query(collection(db, "movimentacoes"), orderBy("data", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistoryLogs(logs);
      setFilteredLogs(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      const filtrado = historyLogs.filter(log => 
        (log.patrimonio && log.patrimonio.toLowerCase().includes(lowerSearch)) ||
        (log.usuario && log.usuario.toLowerCase().includes(lowerSearch)) ||
        (log.localNovo && log.localNovo.toLowerCase().includes(lowerSearch)) ||
        (log.localAnterior && log.localAnterior.toLowerCase().includes(lowerSearch))
      );
      setFilteredLogs(filtrado);
    } else {
      setFilteredLogs(historyLogs);
    }
  }, [searchText, historyLogs]);

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data não registrada';
    const dataObj = timestamp.toDate();
    return dataObj.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const renderLog = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patrimonio}>Patrimônio: {item.patrimonio}</Text>
        <Text style={styles.data}>{formatarData(item.data)}</Text>
      </View>
      
      <Text style={styles.modelo}>{item.tipo} - {item.modelo}</Text>
      
      {item.localAnterior !== item.localNovo && (
        <View style={styles.mudancaBox}>
          <Text style={styles.labelMudanca}>📍 Mudança de Local:</Text>
          <Text style={styles.textoMudanca}>De: <Text style={styles.destaque}>{item.localAnterior || 'N/A'}</Text></Text>
          <Text style={styles.textoMudanca}>Para: <Text style={styles.destaque}>{item.localNovo}</Text></Text>
        </View>
      )}

      {item.statusAnterior !== item.statusNovo && (
        <View style={styles.mudancaBox}>
          <Text style={styles.labelMudanca}>⚠️ Mudança de Status:</Text>
          <Text style={styles.textoMudanca}>De: <Text style={styles.destaque}>{item.statusAnterior || 'N/A'}</Text></Text>
          <Text style={styles.textoMudanca}>Para: <Text style={styles.destaque}>{item.statusNovo}</Text></Text>
        </View>
      )}

      <View style={styles.footerCard}>
        <Ionicons name="person-circle-outline" size={16} color="#666" style={{marginRight: 5}} />
        <Text style={styles.usuario}>{item.usuario || 'Usuário Desconhecido'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar por patrimônio, usuário ou sala..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00184F" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.id}
          renderItem={renderLog}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>
              Nenhum histórico de movimentação encontrado.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  searchContainer: { flexDirection: 'row', backgroundColor: 'white', margin: 15, paddingHorizontal: 15, height: 50, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  searchInput: { flex: 1, fontSize: 16 },
  
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#00184F' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  patrimonio: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  data: { fontSize: 12, color: '#888' },
  modelo: { fontSize: 14, color: '#555', marginBottom: 10 },
  
  mudancaBox: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  labelMudanca: { fontWeight: 'bold', color: '#00184F', marginBottom: 2, fontSize: 13 },
  textoMudanca: { fontSize: 13, color: '#444' },
  destaque: { fontWeight: 'bold', color: '#000' },

  footerCard: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  usuario: { fontSize: 13, color: '#666', fontStyle: 'italic' }
});