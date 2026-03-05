import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  
  // A mágica acontece aqui: useRef não espera renderizar para atualizar
  const lockScan = useRef(false); 

  // Resetar a trava toda vez que a tela ganhar foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      lockScan.current = false;
      setLoading(false);
    });
    return unsubscribe;
  }, [navigation]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: 'white' }}>Precisamos da câmera.</Text>
        <Button onPress={requestPermission} title="Permitir" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    // Se estiver travado, ignora
    if (lockScan.current) return;
    
    // Trava imediatamente
    lockScan.current = true;
    setLoading(true); // Mostra loading visual

    // 1. A MÁGICA DA SERVICE TAG AQUI: 
    // Padroniza a leitura forçando tudo para maiúsculo
    const codigoFormatado = data.toUpperCase();

    console.log(`Lido: ${codigoFormatado}`); // Log limpo, apenas 1 vez

    try {
      // 2. Busca no Firebase usando o codigoFormatado
      const q = query(collection(db, "products"), where("patrimonio", "==", codigoFormatado));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // ITEM ENCONTRADO -> Vai para Edição
        const doc = querySnapshot.docs[0];
        const itemData = { id: doc.id, ...doc.data() };
        
        navigation.navigate('ProductForm', { produto: itemData, modo: 'editar' });

      } else {
        // ITEM NÃO ENCONTRADO -> Vai para Cadastro
        Alert.alert(
          "Novo Item", 
          `Patrimônio/Tag ${codigoFormatado} não cadastrado. Deseja cadastrar?`,
          [
            { 
              text: "Cancelar", 
              onPress: () => { lockScan.current = false; setLoading(false); }, 
              style: "cancel" 
            },
            { 
              text: "Cadastrar", 
              onPress: () => {
                // 3. Envia o codigoFormatado para a tela de Novo
                navigation.navigate('ProductForm', { patrimonioScaneado: codigoFormatado, modo: 'novo' });
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha na leitura.");
      lockScan.current = false; // Destrava em caso de erro
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned} // Não precisa mais da condicional aqui, o ref resolve
        barcodeScannerSettings={{ barcodeTypes: ["code128", "code39", "qr"] }}
      />
      
      {/* Overlay Visual para Foco */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            {!loading && <View style={styles.cornerBorder} />}
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.helpText}>Aponte para o Patrimônio</Text>
          {loading && <ActivityIndicator size="large" color="#00ff00" style={{marginTop: 20}}/>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { flex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  middleContainer: { flexDirection: 'row', height: 200 },
  focusedContainer: { flex: 3 }, // Área transparente do meio
  helpText: { color: 'white', fontSize: 16, marginTop: 20 },
  cornerBorder: { flex: 1, borderWidth: 2, borderColor: '#00ff00', borderRadius: 10 }
});