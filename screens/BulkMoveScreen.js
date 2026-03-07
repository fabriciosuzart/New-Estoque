import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, onSnapshot, arrayUnion, arrayRemove, query, where, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { sendPushNotification } from '../utils/services/NotificationService';

export default function BulkMoveScreen({ navigation }) {
  const [inLobby, setInLobby] = useState(true);
  const [localDestino, setLocalDestino] = useState('');
  const [codigoSalaEntrada, setCodigoSalaEntrada] = useState('');
  const [sessaoPendente, setSessaoPendente] = useState(null); 
  
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [patrimonioManual, setPatrimonioManual] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Controles de Câmera e Sincronização
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const lockScanner = useRef(false); 
  const ouvinteSessao = useRef(null);

  const usuarioLogado = auth.currentUser?.email || 'Usuario Desconhecido';

  // ==========================================
  // NOVO: BUSCA SESSÕES ABANDONADAS (FANTASMAS)
  // ==========================================
  useEffect(() => {
    if (inLobby && usuarioLogado) {
      const buscarSessoesPendentes = async () => {
        try {
          const q = query(
            collection(db, "sessoes_transferencia"),
            where("criadoPor", "==", usuarioLogado),
            where("status", "==", "aberta")
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0]; // Pega a primeira que achar
            setSessaoPendente({ id: docSnap.id, ...docSnap.data() });
          } else {
            setSessaoPendente(null);
          }
        } catch (error) {
          console.error("Erro ao buscar sessões:", error);
        }
      };
      buscarSessoesPendentes();
    }
  }, [inLobby, usuarioLogado]);

  const cancelarSessaoPendente = async () => {
    if (!sessaoPendente) return;
    
    Alert.alert("Cancelar Sessão", "Deseja excluir esta sala? Os itens não serão transferidos.", [
      { text: "Não" },
      { text: "Sim, Excluir", onPress: async () => {
          setIsProcessing(true);
          try {
            await deleteDoc(doc(db, "sessoes_transferencia", sessaoPendente.id));
            setSessaoPendente(null);
          } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível excluir a sessão.");
          } finally {
            setIsProcessing(false);
          }
        } 
      }
    ]);
  };

  // ==========================================
  // 1. LÓGICA DO LOBBY (CRIAR OU ENTRAR)
  // ==========================================
  const criarNovaSessao = async () => {
    if (!localDestino.trim()) {
      Alert.alert("Atenção", "Digite o Local de Destino para criar a sala.");
      return;
    }
    setIsProcessing(true);
    try {
      const codigoSala = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      await setDoc(doc(db, "sessoes_transferencia", codigoSala), {
        localDestino: localDestino,
        criadoPor: usuarioLogado,
        dataCriacao: serverTimestamp(),
        status: 'aberta',
        itens: [] 
      });
      
      entrarNaSessao(codigoSala);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao criar a sala.");
      setIsProcessing(false);
    }
  };

  const entrarNaSessao = async (codigo) => {
    const cod = codigo.toUpperCase().trim();
    if (!cod) return;

    setIsProcessing(true);
    try {
      const docRef = doc(db, "sessoes_transferencia", cod);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().status === 'aberta') {
        ouvinteSessao.current = onSnapshot(docRef, (docAtualizado) => {
          const dados = docAtualizado.data();
          if (dados && dados.status === 'finalizada') {
            Alert.alert("Sessão Concluída", "A transferência foi finalizada por um colega.");
            setSessaoAtiva(null);
            setInLobby(true);
            if (ouvinteSessao.current) ouvinteSessao.current(); 
          } else {
            setSessaoAtiva({ id: docAtualizado.id, ...dados });
          }
        });
        setInLobby(false); 
      } else {
        Alert.alert("Erro", "Sala não encontrada ou já foi finalizada.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao conectar na sala.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 2. LÓGICA DE ESCANEAR E EXCLUIR
  // ==========================================
  const adicionarItemNaLista = async (patrimonio) => {
    if (!patrimonio || !sessaoAtiva) return;
    const codFormatado = patrimonio.toUpperCase().trim();

    if (sessaoAtiva.itens.some(item => item.id === codFormatado)) {
      Alert.alert("Atenção", "Este item já está no carrinho da equipe.");
      setPatrimonioManual('');
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = doc(db, "products", codFormatado);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dados = docSnap.data();
        await updateDoc(doc(db, "sessoes_transferencia", sessaoAtiva.id), {
          itens: arrayUnion({
            id: codFormatado,
            modelo: dados.modelo || 'Não informado',
            tipo: dados.tipo || 'Equipamento',
            local: dados.local || 'Desconhecido'
          })
        });
      } else {
        Alert.alert("Não encontrado", `O patrimônio ${codFormatado} não existe no estoque.`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setPatrimonioManual('');
    }
  };

  const removerItemDaLista = async (itemParaRemover) => {
    if (!sessaoAtiva) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "sessoes_transferencia", sessaoAtiva.id), {
        itens: arrayRemove(itemParaRemover)
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao remover o equipamento da lista.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (lockScanner.current) return; 
    lockScanner.current = true; 
    setScanned(true);
    setShowScanner(false);
    adicionarItemNaLista(data);
  };

  const abrirCamera = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') return;
    }
    lockScanner.current = false; 
    setScanned(false);
    setShowScanner(true);
  };

  // ==========================================
  // 3. O DISPARO FINAL (TRANSFERIR TUDO)
  // ==========================================
  const handleTransferirTodos = async () => {
    if (!sessaoAtiva || sessaoAtiva.itens.length === 0) return;
    setIsProcessing(true);

    try {
      if (ouvinteSessao.current) ouvinteSessao.current();

      let quantidadeMovida = 0;
      const localDestinoFinal = sessaoAtiva.localDestino;

      for (const item of sessaoAtiva.itens) {
        if (item.local !== localDestinoFinal) {
          const docRef = doc(db, "products", item.id);
          
          await updateDoc(docRef, { local: localDestinoFinal, ultimaEdicao: serverTimestamp(), editadoPor: usuarioLogado });

          await addDoc(collection(db, "movimentacoes"), {
            patrimonio: item.id,
            modelo: item.modelo,
            tipo: item.tipo,
            localAnterior: item.local,
            localNovo: localDestinoFinal,
            statusAnterior: 'Disponível',
            statusNovo: 'Disponível',
            data: serverTimestamp(),
            usuario: usuarioLogado,
            tipoAcao: 'Transferência em Massa (Colaborativa)'
          });
          quantidadeMovida++;
        }
      }

      await updateDoc(doc(db, "sessoes_transferencia", sessaoAtiva.id), { status: 'finalizada' });

      if (quantidadeMovida > 0) {
        const tituloPush = "📦 Transferência em Massa";
        const corpoPush = `${quantidadeMovida} equipamento(s) movido(s) para a sala ${localDestinoFinal} por ${usuarioLogado}.`;
        
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          if (userData.pushTokens && userData.pushTokens.length > 0 && userData.email !== usuarioLogado && userData.receberNotificacoes !== false) {
            sendPushNotification(userData.pushTokens, tituloPush, corpoPush);
          }
        });
      }

      Alert.alert("Sucesso!", `Transferência de ${quantidadeMovida} itens finalizada!`);
      navigation.goBack();

    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Ocorreu um problema ao processar a transferência.");
      setIsProcessing(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DAS TELAS
  // ==========================================
  if (showScanner) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ["code128", "code39", "qr"] }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
        <TouchableOpacity style={styles.closeCameraButton} onPress={() => setShowScanner(false)}>
          <Text style={styles.closeCameraText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA 1: O LOBBY
  if (inLobby) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Inventário Colaborativo</Text>
        
        {sessaoPendente && (
          <View style={[styles.card, { borderColor: '#ff9800', borderWidth: 2 }]}>
            <Text style={styles.labelTitle}>⚠️ Sessão em Andamento</Text>
            <Text style={styles.labelDesc}>Você tem uma transferência aberta (SALA: {sessaoPendente.id}) para a sala {sessaoPendente.localDestino}.</Text>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity style={[styles.saveButton, {flex: 1, marginRight: 5}]} onPress={() => entrarNaSessao(sessaoPendente.id)}>
                 <Text style={styles.saveButtonText}>CONTINUAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#d9534f', flex: 1, marginLeft: 5}]} onPress={cancelarSessaoPendente}>
                 <Text style={styles.saveButtonText}>APAGAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.labelTitle}>Criar Nova Sessão</Text>
          <Text style={styles.labelDesc}>Para qual sala os equipamentos vão?</Text>
          <TextInput style={styles.input} placeholder="Ex: M226" value={localDestino} onChangeText={setLocalDestino} />
          <TouchableOpacity style={styles.saveButton} onPress={criarNovaSessao} disabled={isProcessing}>
             {isProcessing ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>CRIAR E ABRIR CÂMERA</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.ouTexto}>OU</Text>

        <View style={styles.card}>
          <Text style={styles.labelTitle}>Ajudar um Colega</Text>
          <Text style={styles.labelDesc}>Digite o código da sala aberta:</Text>
          <TextInput style={styles.input} placeholder="Ex: X9K2" value={codigoSalaEntrada} onChangeText={(texto) => setCodigoSalaEntrada(texto.toUpperCase())} autoCapitalize="characters" />
          <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#4CAF50'}]} onPress={() => entrarNaSessao(codigoSalaEntrada)} disabled={isProcessing}>
            <Text style={styles.saveButtonText}>ENTRAR NA SESSÃO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSessao}>
        <Text style={styles.sessaoTextoId}>SALA: {sessaoAtiva?.id}</Text>
        <Text style={styles.sessaoTextoDestino}>Destino: {sessaoAtiva?.localDestino}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput style={styles.inputManual} placeholder="Digitar Patrimônio..." value={patrimonioManual} onChangeText={setPatrimonioManual} autoCapitalize="characters" />
        <TouchableOpacity style={styles.addButton} onPress={() => adicionarItemNaLista(patrimonioManual)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={abrirCamera}>
          <Ionicons name="barcode-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isProcessing && <ActivityIndicator size="large" color="#00184F" style={{ marginVertical: 10 }} />}

      <FlatList
        data={sessaoAtiva?.itens || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View>
              <Text style={styles.itemPatrimonio}>{item.id} - {item.tipo}</Text>
              <Text style={styles.itemDetalhe}>{item.modelo} (Atual: {item.local})</Text>
            </View>
            <TouchableOpacity onPress={() => removerItemDaLista(item)}>
              <Ionicons name="trash-outline" size={26} color="#d9534f" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Sala vazia. Comece a escanear!</Text>}
      />

      <TouchableOpacity style={[styles.saveButton, sessaoAtiva?.itens.length === 0 && styles.saveButtonDisabled]} onPress={handleTransferirTodos} disabled={sessaoAtiva?.itens.length === 0 || isProcessing}>
        <Text style={styles.saveButtonText}>FINALIZAR E TRANSFERIR {sessaoAtiva?.itens.length} ITEM(S)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#00184F', textAlign: 'center', marginBottom: 20, marginTop: 10 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 10 },
  labelTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  labelDesc: { fontSize: 14, color: '#666', marginBottom: 15 },
  ouTexto: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#999', marginVertical: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ccc', marginBottom: 15 },
  headerSessao: { backgroundColor: '#00184F', padding: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessaoTextoId: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  sessaoTextoDestino: { color: '#a3c2ff', fontSize: 14, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', marginBottom: 15 },
  inputManual: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 10 },
  addButton: { backgroundColor: '#4CAF50', width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginRight: 10 },
  scanButton: { backgroundColor: '#00184F', width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  itemCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 8, justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 1 },
  itemPatrimonio: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemDetalhe: { fontSize: 12, color: '#666', marginTop: 3 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },
  saveButton: { backgroundColor: '#00184F', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeCameraButton: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#d9534f', padding: 15, borderRadius: 8 },
  closeCameraText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});