import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { db } from '../firebaseConfig';
import { doc, updateDoc, addDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function ProductFormScreen({ route, navigation }) {
  const { produto, patrimonioScaneado, modo } = route.params || {};

  // Estados Base
  const [patrimonio, setPatrimonio] = useState(produto?.patrimonio || patrimonioScaneado || '');
  const [tipo, setTipo] = useState(produto?.tipo || 'Computador'); // Padrão
  const [marca, setMarca] = useState(produto?.marca || '');
  const [modelo, setModelo] = useState(produto?.modelo || '');
  const [status, setStatus] = useState(produto?.status || 'Disponível');
  const [local, setLocal] = useState(produto?.local || '');
  const [obs, setObs] = useState(produto?.observacao || '');

  // Estados Específicos de Hardware (Computador/Notebook)
  const [processador, setProcessador] = useState(produto?.processador || '');
  const [memoria, setMemoria] = useState(produto?.memoria || '');
  const [armazenamento, setArmazenamento] = useState(produto?.armazenamento || '');

  const isEditing = modo === 'editar';

  // Lista de Tipos Comuns
  const tiposComuns = ["Computador", "Notebook", "Monitor", "Estabilizador", "Periférico"];

  const handleSave = async () => {
    if (!tipo || !modelo || !local) {
      Alert.alert("Atenção", "Preencha pelo menos Tipo, Modelo e Local.");
      return;
    }

    const dadosParaSalvar = {
      patrimonio,
      tipo,
      marca,
      modelo,
      status,
      local,
      observacao: obs,
      ultimaEdicao: serverTimestamp()
    };

    // Só adiciona campos de hardware se for PC ou Notebook
    if (tipo === "Computador" || tipo === "Notebook") {
      dadosParaSalvar.processador = processador;
      dadosParaSalvar.memoria = memoria;
      dadosParaSalvar.armazenamento = armazenamento;
    }

    try {
      // 1. Defina o ID do documento ANTES do if/else
      // Se estiver editando, usa o ID do produto. Se for novo, usa o Patrimônio digitado.
      const idDoDocumento = isEditing ? produto.id : patrimonio;
      
      // Validação de segurança: Não deixa salvar se não tiver ID
      if (!idDoDocumento) {
        Alert.alert("Erro", "O Patrimônio é obrigatório para salvar.");
        return;
      }

      // 2. Cria a referência para o banco
      const docRef = doc(db, "products", idDoDocumento);

      if (isEditing) {
        // ATUALIZAR (Update)
        // updateDoc só atualiza os campos que mudaram
        await updateDoc(docRef, dadosParaSalvar);
        Alert.alert("Atualizado", "Item editado com sucesso!");
      } else {
        // NOVO (Set)
        // Adiciona data de criação
        dadosParaSalvar.dataCriacao = serverTimestamp();
        
        // setDoc escreve/sobrescreve naquele endereço exato (ID = Patrimônio)
        await setDoc(docRef, dadosParaSalvar);
        Alert.alert("Cadastrado", "Item salvo no ID: " + patrimonio);
      }
      
      navigation.goBack();
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Falha ao salvar. Verifique se o patrimônio está vazio ou repetido.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>
        {isEditing ? `Editando: ${patrimonio}` : "Novo Cadastro"}
      </Text>

      {/* SELEÇÃO DE TIPO (CHIPS) */}
      <Text style={styles.label}>O que é esse equipamento?</Text>
      <View style={styles.chipContainer}>
        {tiposComuns.map((t) => (
          <TouchableOpacity 
            key={t} 
            style={[styles.chip, tipo === t && styles.chipSelected]}
            onPress={() => setTipo(t)}
          >
            <Text style={[styles.chipText, tipo === t && styles.chipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Campo Tipo Manual (caso não seja nenhum dos botões acima) */}
      <TextInput 
        style={styles.inputSmall} 
        value={tipo} 
        onChangeText={setTipo} 
        placeholder="Ou digite outro tipo..."
      />

      {/* CAMPOS COMUNS (Aparecem para todos) */}
      <View style={styles.section}>
        <TextInput 
          style={styles.input} 
          placeholder="Marca (Ex: Dell, HP)" 
          value={marca} onChangeText={setMarca} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Modelo (Ex: Optiplex 3050)" 
          value={modelo} onChangeText={setModelo} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Local (Ex: M220, Almoxarifado)" 
          value={local} onChangeText={setLocal} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Status (Ex: Em Uso, Defeito)" 
          value={status} onChangeText={setStatus} 
        />
      </View>

      {/* CAMPOS CONDICIONAIS (Só aparecem se for PC/Notebook) */}
      {(tipo === "Computador" || tipo === "Notebook") && (
        <View style={styles.hardwareSection}>
          <Text style={styles.sectionTitle}>Configuração de Hardware</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Processador (Ex: i5 10th)" 
            value={processador} onChangeText={setProcessador} 
          />
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, {flex: 1, marginRight: 5}]} 
              placeholder="RAM (Ex: 8GB)" 
              value={memoria} onChangeText={setMemoria} 
            />
            <TextInput 
              style={[styles.input, {flex: 1, marginLeft: 5}]} 
              placeholder="Disco (Ex: SSD 240)" 
              value={armazenamento} onChangeText={setArmazenamento} 
            />
          </View>
        </View>
      )}

      <Text style={styles.label}>Observações</Text>
      <TextInput 
        style={[styles.input, {height: 80}]} 
        multiline 
        placeholder="Detalhes adicionais..." 
        value={obs} onChangeText={setObs} 
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>SALVAR</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#00184F', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '600' },
  
  // Estilo dos Chips
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { backgroundColor: '#e0e0e0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#00184F' },
  chipText: { color: '#333' },
  chipTextSelected: { color: 'white', fontWeight: 'bold' },

  section: { marginBottom: 15 },
  hardwareSection: { backgroundColor: '#e8efff', padding: 10, borderRadius: 8, marginBottom: 15, borderColor: '#cadaff', borderWidth: 1 },
  sectionTitle: { color: '#00184F', fontWeight: 'bold', marginBottom: 10 },
  
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  inputSmall: { backgroundColor: 'transparent', padding: 5, marginBottom: 15, borderBottomWidth: 1, borderColor: '#ccc' },
  row: { flexDirection: 'row' },
  
  saveButton: { backgroundColor: '#00184F', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});