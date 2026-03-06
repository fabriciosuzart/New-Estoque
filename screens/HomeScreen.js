import React, { useEffect } from "react";
import { View, Button, StyleSheet, TouchableOpacity } from "react-native";
import { auth, db } from "../firebaseConfig"; // Juntei a importação do db aqui
import { signOut } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import DynamicButton from "../components/Buttons";
import { Ionicons } from '@expo/vector-icons'; 
import { registerForPushNotificationsAsync } from '../utils/services/NotificationService'; 

const HomeScreen = ({ navigation }) => {

  useEffect(() => {
    async function configurarNotificacoes() {
      const utilizadorLogado = auth.currentUser;

      if (utilizadorLogado) {
        try {
          const token = await registerForPushNotificationsAsync();
          
          if (token) {
            const userRef = doc(db, 'users', utilizadorLogado.email);
            
            await setDoc(userRef, {
              email: utilizadorLogado.email,
              pushToken: token,
              ultimoAcesso: new Date()
            }, { merge: true }); 
            
            console.log("Token guardado no Firebase com sucesso para:", utilizadorLogado.email);
          }
        } catch (error) {
          console.error("Erro ao configurar notificações:", error);
        }
      }
    }

    configurarNotificacoes();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      
      <DynamicButton
        title="Estoque"
        icon={require('../assets/images/caixas.png')}
        screen="Estoque"
      />
      
      <DynamicButton
        title="Histórico"
        icon={require('../assets/images/mover.png')}
        screen="History"
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={handleLogout} color="#d9534f" />
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("Scanner")}
      >
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
    position: 'relative', 
  },
  fab: {
    position: 'absolute', 
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    right: 25,  
    bottom: 30, 
    backgroundColor: '#00184F', 
    borderRadius: 32.5, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    zIndex: 999, 
  }
});