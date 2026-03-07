import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { registerForPushNotificationsAsync } from '../utils/services/NotificationService';

export default function SettingsScreen({ navigation }) {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceToken, setDeviceToken] = useState(null);
  
  const utilizador = auth.currentUser;

  useEffect(() => {
    async function carregarPreferencias() {
      if (!utilizador) return;
      
      try {
        const token = await registerForPushNotificationsAsync();
        setDeviceToken(token);

        if (token) {
          const userRef = doc(db, 'users', utilizador.email);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const dados = userSnap.data();
            if (dados.receberNotificacoes !== false) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarPreferencias();
  }, [utilizador]);

  const toggleSwitch = async (valorNovo) => {
    setIsPushEnabled(valorNovo); 

    if (!utilizador || !deviceToken) {
      Alert.alert("Erro", "Não foi possível identificar o aparelho.");
      setIsPushEnabled(!valorNovo); 
      return;
    }

    const userRef = doc(db, 'users', utilizador.email);

    try {
        if (valorNovo === true) {
          await updateDoc(userRef, {
            receberNotificacoes: true,
            pushTokens: arrayUnion(deviceToken) 
          });
        } else {
          await updateDoc(userRef, {
            receberNotificacoes: false
          });
        }
      } catch (error) {
        console.error("Erro ao atualizar banco de dados:", error);
        Alert.alert("Erro", "Falha ao salvar a sua preferência.");
        setIsPushEnabled(!valorNovo); 
      }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00184F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.perfilCard}>
        <Ionicons name="person-circle" size={70} color="#00184F" />
        <Text style={styles.emailTexto}>{utilizador?.email}</Text>
        <Text style={styles.cargoTexto}>Analista de TI / Suporte</Text>
      </View>

      <Text style={styles.secaoTitulo}>Preferências do Aplicativo</Text>
      
      <View style={styles.configRow}>
        <View style={styles.configInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.configTitulo}>Alertas de Movimentação</Text>
            <Text style={styles.configDescricao}>Receber avisos (push) no aparelho</Text>
          </View>
        </View>
        <Switch
          trackColor={{ false: "#d3d3d3", true: "#81b0ff" }}
          thumbColor={isPushEnabled ? "#00184F" : "#f4f3f4"}
          onValueChange={toggleSwitch}
          value={isPushEnabled}
        />
      </View>

      <TouchableOpacity style={styles.logoutBotao} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#d9534f" style={{marginRight: 8}} />
        <Text style={styles.logoutTexto}>Sair da Conta (Logout)</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  perfilCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  emailTexto: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10 },
  cargoTexto: { fontSize: 14, color: '#777', marginTop: 4 },

  secaoTitulo: { fontSize: 14, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 5 },
  
  configRow: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  configInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { backgroundColor: '#00184F', padding: 8, borderRadius: 8, marginRight: 15 },
  configTitulo: { fontSize: 16, fontWeight: '500', color: '#333' },
  configDescricao: { fontSize: 12, color: '#888', marginTop: 2 },

  logoutBotao: { flexDirection: 'row', backgroundColor: '#ffe5e5', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 20 },
  logoutTexto: { color: '#d9534f', fontWeight: 'bold', fontSize: 16 }
});