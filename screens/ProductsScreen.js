import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');

  const tipos = ["Todos", "Computador", "Notebook", "Monitor", "Estabilizador", "Periférico"];

  useEffect(() => {
    // Busca em Tempo Real (Live) ordenado pela data de criação
    const q = query(collection(db, "products"), orderBy("ultimaEdicao", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(lista);
      setFilteredProducts(lista); // Inicializa a lista filtrada com tudo
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lógica de Filtro (Roda sempre que o texto ou o tipo muda)
  useEffect(() => {
    let resultado = products;

    // 1. Filtro por Tipo (Botões)
    if (selectedType !== 'Todos') {
      resultado = resultado.filter(item => item.tipo === selectedType);
    }

    // 2. Filtro por Texto (Barra de Pesquisa)
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      resultado = resultado.filter(item => 
        (item.patrimonio && item.patrimonio.toLowerCase().includes(lowerSearch)) ||
        (item.modelo && item.modelo.toLowerCase().includes(lowerSearch)) ||
        (item.local && item.local.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredProducts(resultado);
  }, [searchText, selectedType, products]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ProductForm', { produto: item, modo: 'editar' })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patrimonio}>#{item.patrimonio || "S/N"}</Text>
        <Text style={[styles.status, { color: item.status === 'Disponível' || item.status === 'ok' ? 'green' : 'red' }]}>
          {item.status}
        </Text>
      </View>
      
      <Text style={styles.modelo}>{item.tipo} - {item.modelo}</Text>
      <Text style={styles.local}>📍 {item.local}</Text>
      
      {/* Mostra detalhes extras se for PC */}
      {(item.tipo === 'Computador' || item.tipo === 'Notebook') && (
        <Text style={styles.specs}>⚙️ {item.processador} • {item.memoria}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar patrimônio, modelo, local..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
             <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de Tipo (Chips) */}
      <View style={{ height: 50 }}>
        <FlatList 
          data={tipos}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chip, selectedType === item && styles.chipSelected]}
              onPress={() => setSelectedType(item)}
            >
              <Text style={[styles.chipText, selectedType === item && styles.chipTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de Produtos */}
      {loading ? (
        <ActivityIndicator size="large" color="#00184F" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>
              Nenhum item encontrado.
            </Text>
          }
        />
      )}
      
      {/* Botão Flutuante para Adicionar Manualmente (Caso não queira usar o Scanner) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ProductForm', { modo: 'novo' })}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 2, // Sombra Android
    shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, // Sombra iOS
  },
  searchInput: { flex: 1, fontSize: 16 },
  
  filterList: { paddingHorizontal: 15, alignItems: 'center' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
    height: 36,
  },
  chipSelected: { backgroundColor: '#00184F' },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextSelected: { color: 'white' },

  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  patrimonio: { fontWeight: 'bold', fontSize: 16, color: '#00184F' },
  status: { fontWeight: '600', fontSize: 14 },
  modelo: { fontSize: 16, color: '#333', marginBottom: 2 },
  local: { fontSize: 14, color: '#666' },
  specs: { fontSize: 12, color: '#888', marginTop: 4 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00184F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  }
});