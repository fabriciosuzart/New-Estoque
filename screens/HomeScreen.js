import React from "react";
import { View, Button, StyleSheet, TouchableOpacity } from "react-native";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import DynamicButton from "../components/Buttons";
import { Ionicons } from '@expo/vector-icons'; // Importando ícone para o scanner

const HomeScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      {/* Seus botões originais */}
      <DynamicButton
        title="Estoque"
        icon={require('../assets/images/caixas.png')}
        screen="Estoque"
      />
      {/* <DynamicButton
        title="Documentação"
        icon={require('../assets/images/documentacao.png')}
        screen="Documentacao"
      /> */}
      
      <DynamicButton
        title="Histórico"
        icon={require('../assets/images/mover.png')}
        screen="History"
      />

      {/* Botão de Logout antigo (Opcional, pois já colocamos no Header) */}
      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={handleLogout} color="#d9534f" />
      </View>

      {/* NOVO: Botão Flutuante (FAB) do Scanner */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("Scanner")}
      >
        {/* Ícone de código de barras branco */}
        <Ionicons name="barcode-outline" size={32} color="white" />
      </TouchableOpacity>

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#eeeeee",
    position: 'relative', // Importante para o botão flutuante se posicionar em relação a esta tela
  },
  // Estilo do Botão Flutuante
  fab: {
    position: 'absolute', // Faz ele flutuar sobre os outros elementos
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    right: 25,  // Distância da direita
    bottom: 30, // Distância do fundo
    backgroundColor: '#00184F', // Azul oficial da Unisanta
    borderRadius: 32.5, // Metade da largura para ficar redondinho
    elevation: 8, // Sombra para dar profundidade no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    zIndex: 999, // Garante que fique por cima de tudo
  }
});