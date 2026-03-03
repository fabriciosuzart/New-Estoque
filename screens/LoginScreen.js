import React, { useState } from "react";
import { Text, TextInput, Button, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import Firebase auth

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.replace("Home"); // Navigate to HomeScreen
        } catch (error) {
            Alert.alert("Falha no login tente novamente");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS == "ios" ? "height" : "height"}
            style={{ flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#1F99C0" }}>
            <Image
                style={styles.logo}
                source={require('../assets/images/logounisanta.png')}
            />
            <Text style={{ fontSize: 24, textAlign: "center", marginBottom: 20, color: "white" }}>Login</Text>
            <TextInput
                placeholder="Email"
                textContentType="none" // Evita sugestões no iOS
                autoComplete="off" // Tenta desativar sugestões no Android
                importantForAutofill="no"
                value={email}
                onChangeText={setEmail}
                color={"white"}
                placeholderTextColor={"#EEEEEE"}
                selectionColor={"white"}
                style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8, borderBottomColor: "white", fontSize: 16 }}
            />
            <TextInput
                placeholder="Senha"
                textContentType="none" // Evita sugestões no iOS
                autoComplete="off" // Tenta desativar sugestões no Android
                importantForAutofill="no"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                color={"white"}
                placeholderTextColor={"#EEEEEE"}
                selectionColor={"white"}
                style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8, borderBottomColor: "white", fontSize: 16 }}
                onSubmitEditing={() => {
                    handleLogin();
                }}
            />
            <Button title="Sign In" onPress={handleLogin} />
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    logo: {
        alignItems: 'center',
        marginBottom: 20,
        marginLeft: 126,
        height: 100,
        width: 100
    }
})