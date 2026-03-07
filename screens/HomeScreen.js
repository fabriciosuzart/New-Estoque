import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, collection, query, where, getCountFromServer, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../utils/services/NotificationService';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, saudaveis: 0, atencao: 0 });
  const [loading, setLoading] = useState(true);

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
              pushTokens: arrayUnion(token), 
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

  useFocusEffect(
    useCallback(() => {
      carregarMetricas();
    }, [])
  );

  const carregarMetricas = async () => {
    setLoading(true);
    try {
      const coll = collection(db, "products");

      const totalSnap = await getCountFromServer(coll);
      
      const qSaudaveis = query(coll, where("status", "in", ["Disponível", "Em uso", "Emprestado"]));
      const saudaveisSnap = await getCountFromServer(qSaudaveis);

      const qAtencao = query(coll, where("status", "in", ["Em manutenção", "Defeito", "Para Descarte"]));
      const atencaoSnap = await getCountFromServer(qAtencao);

      setStats({
        total: totalSnap.data().count,
        saudaveis: saudaveisSnap.data().count,
        atencao: atencaoSnap.data().count
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollArea}>

        <Text style={styles.sectionTitle}>Visão Geral do Estoque</Text>
        
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00184F" />
            <Text style={{color: '#666', marginTop: 10}}>Calculando ativos...</Text>
          </View>
        ) : (
          <View style={styles.dashboardGrid}>
            
            <View style={[styles.cardTracker, { backgroundColor: '#00184F', width: '100%' }]}>
              <View>
                <Text style={styles.cardTrackerTitle}>Total de Ativos</Text>
                <Text style={styles.cardTrackerNumber}>{stats.total}</Text>
              </View>
              <Ionicons name="hardware-chip-outline" size={40} color="rgba(255,255,255,0.3)" />
            </View>

            <View style={styles.rowCards}>
              <View style={[styles.cardTracker, { backgroundColor: '#28a745', flex: 1, marginRight: 5 }]}>
                <View>
                  <Text style={styles.cardTrackerTitle}>Operacionais</Text>
                  <Text style={styles.cardTrackerNumber}>{stats.saudaveis}</Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={30} color="rgba(255,255,255,0.3)" />
              </View>

              <View style={[styles.cardTracker, { backgroundColor: '#d9534f', flex: 1, marginLeft: 5 }]}>
                <View>
                  <Text style={styles.cardTrackerTitle}>Com Defeito</Text>
                  <Text style={styles.cardTrackerNumber}>{stats.atencao}</Text>
                </View>
                <Ionicons name="warning-outline" size={30} color="rgba(255,255,255,0.3)" />
              </View>
            </View>

          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Acesso Rápido</Text>

        <View style={styles.menuGrid}>
          
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("Estoque")}>
            <Ionicons name="cube" size={32} color="#fff" />
            <Text style={styles.menuButtonText}>Estoque</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("History")}>
            <Ionicons name="time" size={32} color="#fff" />
            <Text style={styles.menuButtonText}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("BulkMove")}>
            <Ionicons name="swap-horizontal" size={32} color="#fff" />
            <Text style={styles.menuButtonText}>Mover Lote</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings" size={32} color="#fff" />
            <Text style={styles.menuButtonText}>Opções</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("Scanner")}
      >
        <Ionicons name="barcode-outline" size={28} color="white" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', 
  },
  scrollArea: {
    padding: 20,
    paddingBottom: 100, 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  dashboardGrid: {
    marginBottom: 20,
  },
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardTracker: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTrackerTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTrackerNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    backgroundColor: '#0097a7', 
    width: '48%', 
    aspectRatio: 1.1, 
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
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