import React, { useState } from 'react';
import { doc, updateDoc, setDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { sendPushNotification } from '../utils/services/NotificationService';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function ProductFormScreen({ route, navigation }) {
  const { produto, patrimonioScaneado, modo } = route.params || {};
  const isEditing = modo === 'editar';

  const auth = getAuth();
  const usuarioLogado = auth.currentUser?.email || 'Usuario Desconhecido';

  const [patrimonio, setPatrimonio] = useState(produto?.patrimonio || patrimonioScaneado || '');

  const [tipo, setTipo] = useState(produto?.tipo || 'Computador');
  const [tipoOutro, setTipoOutro] = useState('');

  const [marca, setMarca] = useState(produto?.marca || '');
  const [modelo, setModelo] = useState(produto?.modelo || '');

  const [status, setStatus] = useState(produto?.status || 'Disponível');

  const [local, setLocal] = useState(produto?.local || '');
  const [obs, setObs] = useState(produto?.observacao || '');

  const [processador, setProcessador] = useState(produto?.processador || '');
  const [memoria, setMemoria] = useState(produto?.memoria || '');
  const [armazenamento, setArmazenamento] = useState(produto?.armazenamento || '');

  const tiposComuns = ["Computador", "Notebook", "Monitor", "Estabilizador", "Periférico", "Outro"];
  const statusComuns = ["Disponível", "Em uso", "Emprestado", "Em manutenção", "Defeito", "Para Descarte"];

  const handleSave = async () => {
    const tipoFinal = tipo === 'Outro' ? tipoOutro : tipo;
    
    // VACINA: Força letra maiúscula e arranca espaços em branco (trim) do início e do fim
    const patrimonioLimpo = patrimonio ? patrimonio.toUpperCase().trim() : '';

    if (!tipoFinal || !modelo || !local || !patrimonioLimpo) {
      Alert.alert("Atenção", "Preencha Patrimônio, Tipo, Modelo e Local.");
      return;
    }

    const dadosParaSalvar = {
      patrimonio: patrimonioLimpo,
      tipo: tipoFinal,
      marca,
      modelo,
      status,
      local,
      observacao: obs,
      ultimaEdicao: serverTimestamp(),
      editadoPor: usuarioLogado
    };

    if (tipoFinal === "Computador" || tipoFinal === "Notebook") {
      dadosParaSalvar.processador = processador;
      dadosParaSalvar.memoria = memoria;
      dadosParaSalvar.armazenamento = armazenamento;
    }

    try {
      const idDoDocumento = isEditing ? produto.id : patrimonio;
      const docRef = doc(db, "products", idDoDocumento);

      if (isEditing) {
        const mudouLocal = produto.local !== local;
        const mudouStatus = produto.status !== status;

        if (mudouLocal || mudouStatus) {
          const logMovimentacao = {
            patrimonio: patrimonio,
            modelo: modelo,
            tipo: tipoFinal,
            localAnterior: produto.local,
            localNovo: local,
            statusAnterior: produto.status,
            statusNovo: status,
            data: serverTimestamp(),
            usuario: usuarioLogado,
            tipoAcao: mudouLocal ? 'Transferência de Local' : 'Mudança de Status'
          };

          await addDoc(collection(db, "movimentacoes"), logMovimentacao);
          try {
            const tituloPush = mudouLocal ? "📍 Movimentação de Ativo" : "⚠️ Mudança de Status";
            const corpoPush = mudouLocal
              ? `O ${tipoFinal} (${patrimonio}) foi movido da sala ${produto.local} para a ${local} por ${usuarioLogado}.`
              : `O status do ${tipoFinal} (${patrimonio}) mudou para "${status}".`;

            const usersSnapshot = await getDocs(collection(db, "users"));

            usersSnapshot.forEach((userDoc) => {
              const userData = userDoc.data();
              
              if (userData.pushTokens && userData.pushTokens.length > 0 && userData.email !== usuarioLogado && userData.receberNotificacoes !== false) {
                 sendPushNotification(userData.pushTokens, tituloPush, corpoPush);
              }
            });
          } catch (notifError) {
            console.error("Erro ao processar o envio das notificações:", notifError);
          }
        }

        await updateDoc(docRef, dadosParaSalvar);
        Alert.alert("Atualizado", "Item editado com sucesso!");

      } else {
        dadosParaSalvar.dataCriacao = serverTimestamp();
        await setDoc(docRef, dadosParaSalvar);

        await addDoc(collection(db, "movimentacoes"), {
          patrimonio: patrimonio,
          modelo: modelo,
          localNovo: local,
          statusNovo: status,
          data: serverTimestamp(),
          usuario: usuarioLogado,
          tipoAcao: 'Cadastro Inicial'
        });

        Alert.alert("Cadastrado", "Item salvo no ID: " + patrimonio);
      }

      navigation.goBack();

    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar. Verifique sua conexão.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>
          {isEditing ? `Editando Ativo` : "Novo Cadastro"}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Nº do Patrimônio / Service Tag *</Text>
          <TextInput
            style={[styles.input, isEditing && styles.inputDisabled]}
            placeholder="Ex: 016266 ou J8B3C1"
            value={patrimonio}
            onChangeText={(text) => setPatrimonio(text.toUpperCase())}
            editable={!isEditing}
            autoCapitalize="characters"
          />
        </View>

        <Text style={styles.label}>Equipamento *</Text>
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

        {tipo === 'Outro' && (
          <TextInput
            style={styles.inputWarning}
            value={tipoOutro}
            onChangeText={setTipoOutro}
            placeholder="Especifique o equipamento..."
            autoFocus
          />
        )}

        <Text style={[styles.label, { marginTop: 10 }]}>Status do Equipamento *</Text>
        <View style={styles.chipContainer}>
          {statusComuns.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, status === s && styles.statusSelected]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.chipText, status === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Detalhes da Máquina</Text>
          <TextInput style={styles.input} placeholder="Marca (Ex: Dell, HP)" value={marca} onChangeText={setMarca} />
          <TextInput style={styles.input} placeholder="Modelo (Ex: Optiplex 3050) *" value={modelo} onChangeText={setModelo} />
          <TextInput style={styles.input} placeholder="Localização Atual (Ex: M220) *" value={local} onChangeText={setLocal} />
        </View>

        {(tipo === "Computador" || tipo === "Notebook") && (
          <View style={styles.hardwareSection}>
            <Text style={styles.sectionTitle}>Configuração de Hardware</Text>
            <TextInput style={styles.input} placeholder="Processador" value={processador} onChangeText={setProcessador} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="RAM" value={memoria} onChangeText={setMemoria} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Armazenamento" value={armazenamento} onChangeText={setArmazenamento} />
            </View>
          </View>
        )}

        <Text style={styles.label}>Observações</Text>
        <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Motivo do defeito, para quem foi emprestado..." value={obs} onChangeText={setObs} />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SALVAR NO ESTOQUE</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#00184F', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: 'bold' },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#00184F' },
  statusSelected: { backgroundColor: '#007BFF' },
  chipText: { color: '#333' },
  chipTextSelected: { color: 'white', fontWeight: 'bold' },

  section: { marginBottom: 15 },
  hardwareSection: { backgroundColor: '#e8efff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#cadaff' },
  sectionTitle: { color: '#00184F', fontWeight: 'bold', marginBottom: 10 },

  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  inputDisabled: { backgroundColor: '#e9ecef', color: '#6c757d' },
  inputWarning: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ffe69c' },
  row: { flexDirection: 'row' },

  saveButton: { backgroundColor: '#00184F', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});