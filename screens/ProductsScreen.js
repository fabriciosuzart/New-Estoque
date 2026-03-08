import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos'); 

  const tipos = ["Todos", "Computador", "Notebook", "Monitor", "Estabilizador", "Periférico", "Outro"];
  const statusList = ["Todos", "Disponível", "Em uso", "Emprestado", "Em manutenção", "Defeito", "Para Descarte"];

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("ultimaEdicao", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(lista);
      setFilteredProducts(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let resultado = products;

    if (selectedType !== 'Todos') {
      resultado = resultado.filter(item => item.tipo === selectedType);
    }

    if (selectedStatus !== 'Todos') {
      resultado = resultado.filter(item => item.status === selectedStatus);
    }

    if (searchText.trim() !== '') {
      const lowerSearch = searchText.toLowerCase().trim();
      
      resultado = resultado.filter(item => {
        const stringGigante = Object.values(item)
          .map(valor => String(valor))
          .join(' ') 
          .toLowerCase();
        
        return stringGigante.includes(lowerSearch);
      });
    }

    setFilteredProducts(resultado);
  }, [searchText, selectedType, selectedStatus, products]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Disponível': return '#28a745'; 
      case 'Em uso': return '#007bff'; 
      case 'Defeito': return '#dc3545'; 
      case 'Em manutenção': return '#fd7e14'; 
      case 'Emprestado': return '#6f42c1'; 
      case 'Para Descarte': return '#6c757d'; 
      default: return '#17a2b8';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ProductForm', { produto: item, modo: 'editar' })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patrimonio}>#{item.patrimonio || "S/N"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.modelo}>{item.tipo} - {item.modelo}</Text>
      <Text style={styles.local}>📍 Local: {item.local}</Text>
      
      {(item.tipo === 'Computador' || item.tipo === 'Notebook') && (
        <Text style={styles.specs}>⚙️ {item.processador} • {item.memoria}</Text>
      )}

      <View style={styles.footerCard}>
        <Text style={styles.editadoPor}>
          {item.editadoPor ? `👤 Atualizado por: ${item.editadoPor}` : '👤 Sem registro de edição'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Busca universal (Local, i3, Dell...)"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
             <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ maxHeight: 110, paddingBottom: 10 }}>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Tipo:</Text>
          <FlatList 
            data={tipos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.chip, selectedType === item && styles.chipSelected]}
                onPress={() => setSelectedType(item)}
              >
                <Text style={[styles.chipText, selectedType === item && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <FlatList 
            data={statusList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.chip, selectedStatus === item && styles.statusChipSelected]}
                onPress={() => setSelectedStatus(item)}
              >
                <Text style={[styles.chipText, selectedStatus === item && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00184F" style={{marginTop: 50}} />
      ) : (
        <>
          <Text style={styles.resultsCount}>
            Total de equipamentos encontrados: {filteredProducts.length}
          </Text>

          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 15, paddingBottom: 80 }}
            ListEmptyComponent={
              <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>
                Nenhum equipamento encontrado com estes filtros.
              </Text>
            }
          />
        </>
      )}
      
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
  
  resultsCount: {
    paddingHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00184F',
    textAlign: 'right' 
  },

  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 5,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  searchInput: { flex: 1, fontSize: 16 },
  
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 10 },
  filterLabel: { fontWeight: 'bold', color: '#555', marginRight: 10, width: 45 },
  
  chip: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#e0e0e0', borderRadius: 15, marginRight: 8 },
  chipSelected: { backgroundColor: '#00184F' },
  statusChipSelected: { backgroundColor: '#007BFF' }, 
  chipText: { color: '#333', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: 'white' },

  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patrimonio: { fontWeight: 'bold', fontSize: 18, color: '#00184F' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  modelo: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 2 },
  local: { fontSize: 14, color: '#555', marginBottom: 4 },
  specs: { fontSize: 13, color: '#777', marginTop: 4, backgroundColor: '#f8f9fa', padding: 5, borderRadius: 5 },

  footerCard: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  editadoPor: { fontSize: 12, color: '#888', fontStyle: 'italic' },

  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00184F', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 3} },
});