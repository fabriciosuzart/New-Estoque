import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import DocumentacaoScreen from "../screens/DocumentacaoScreen";
import MovimentacaoScreen from "../screens/MovimentacaoScreen";
import ProductListScreen from "../screens/ProductsScreen";
import ScannerScreen from "../screens/ScannerScreen";
import ProductFormScreen from "../screens/ProductFormScreen";
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createStackNavigator();

export default function StackRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []); ``

  const handleLogout = async (navigation) => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("Erro ao sair: ", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#00184F" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true, // Correto (Booleano)
        headerTintColor: 'white',
        headerStyle: { backgroundColor: '#00184F' },
        headerBackTitleVisible: false, // ✅ CORREÇÃO: É assim que se esconde o texto globalmente
      }}
      initialRouteName={user ? "Home" : "Login"}
    >

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          // headerBackTitle removido daqui pois headerBackTitleVisible global já resolve
          headerRight: () => (
            <TouchableOpacity style={styles.buttonRight} onPress={() => handleLogout(navigation)}>
              <Ionicons name="exit" size={24} color="white" />
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity style={styles.buttonLeft} onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

      {/* Removi todos os 'headerBackTitle: false' que causam o erro de tipo */}
      <Stack.Screen name="Estoque" component={ProductListScreen} options={{ title: 'Estoque' }} />
      <Stack.Screen name="Documentacao" component={DocumentacaoScreen} options={{ title: "Documentação" }} />
      <Stack.Screen name="Movimentacao" component={MovimentacaoScreen} options={{ title: "Movimentação" }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Auditoria e Movimentações' }}/>
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Leitor de Patrimônio', headerBackTitleVisible: false }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Gerenciar Item' }} />

    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  buttonRight: { marginRight: 15 },
  buttonLeft: { marginLeft: 15 },
});