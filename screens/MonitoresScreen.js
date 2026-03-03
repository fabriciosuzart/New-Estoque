import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Platform, StyleSheet, TextInput, TouchableOpacity, Modal, Button, KeyboardAvoidingView, ScrollView, Keyboard, TouchableWithoutFeedback, opacity } from "react-native";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Import Firestore database
import { Ionicons } from '@expo/vector-icons';
import { updateDoc } from "firebase/firestore";
import Toast from 'react-native-toast-message';
import { auth } from "../firebaseConfig";


const MonitoresScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [infoModal, setInfoModal] = useState(false);
    const [filterModal, setFilterModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchText, setSearchText] = useState(""); // State for search input
    const [allProducts, setAllProducts] = useState([]); // Stores all products
    const [filteredProducts, setFilteredProducts] = useState([]); // Stores filtered products

    // Form fields
    const [patrimonio, setPatrimonio] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [status, setStatus] = useState("");
    const [local, setLocal] = useState("");
    const [entrada, setEntrada] = useState("");
    const [observacao, setObservacao] = useState("");

    const [selectedPatrimonio, setSelectedPatrimonio] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState("patrimonio"); // Default filter
    const categories = ["marca", "status", "local", "modelo"];
    const [itemCount, setItemCount] = useState(0);


    // Fetch all products from Firestore on mount
    const fetchAllProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "monitores"));
            const monitores = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setAllProducts(monitores); // Store all products
            setFilteredProducts(monitores); // Initially, show all products
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        fetchAllProducts(); // Fetch all items on component mount
    }, []);

    // Filtering logic
    useEffect(() => {
        let filtered = allProducts;

        if (searchText.trim() !== "") {
            filtered = filtered.filter(product =>
                product[selectedCategory]?.toString().toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
        setItemCount(filtered.length); // Update count of filtered items
    }, [searchText, allProducts, selectedCategory]);


    const getUserName = () => {
        const user = auth.currentUser; // Get the current authenticated user

        if (user) {
            return user.displayName || user.email || "Unknown";
        } else {
            return "Guest"; // Handle cases where no user is logged in
        }
    };


    // Function to add a new product
    const addProduct = async () => {
        if (!patrimonio.trim()) {
            alert("Asset field is required");
            return;
        }

        const userName = getUserName();

        try {
            await setDoc(doc(db, "monitores", patrimonio), {
                marca,
                status,
                modelo,
                local,
                patrimonio,
                entrada,
                observacao,
                editedBy: userName, // Store the username
                timestamp: new Date().toISOString() // Store timestamp
            });

            // Update UI after adding the product
            setFilteredProducts(prevProducts => [
                ...prevProducts,
                { id: patrimonio, marca, status, local, patrimonio, modelo, entrada, editedBy, observacao},
            ]);

            // Clear inputs
            setPatrimonio("");
            setMarca("");
            setModelo("");
            setStatus("");
            setLocal("");
            setObservacao("");
            setEntrada("");

            setModalVisible(false); // Close modal

            Toast.show({
                type: 'success',
                text1: 'Sucesso!',
                text2: 'Equipamento adicionado!',
                visibilityTime: 3000,
                position: 'top',
            });

        } catch (error) {
            console.error("Erro ao adicionar: ", error);
        }
    };

    const editProduct = (item) => {
        // Load data into state
        setPatrimonio(item.patrimonio);
        setModelo(item.modelo);
        setMarca(item.marca);
        setStatus(item.status);
        setLocal(item.local);
        setEntrada(item.entrada);
        setObservacao(item.observacao);

        setSelectedPatrimonio(item.id); // Store the item ID
        setIsEditing(true);
        setModalVisible(true);
    };

    const infoButton = (item) => {
        setSelectedItem(item);
        setInfoModal(true);
    };

    const updateProduct = async () => {
        if (!selectedPatrimonio) return;

        const userName = getUserName();

        try {
            const updatedProduct = {
                patrimonio,
                marca,
                modelo,
                status,
                local,
                observacao,
                entrada,
                editedBy: userName, 
                timestamp: new Date().toISOString()
            };

            // Update Firestore
            const docRef = doc(db, "monitores", selectedPatrimonio);
            await setDoc(docRef, updatedProduct);

            // Update UI manually instead of refetching all products
            setFilteredProducts(prevProducts => prevProducts.map(p => p.id === selectedPatrimonio ? { id: selectedPatrimonio, ...updatedProduct } : p));

            Toast.show({
                type: 'success',
                text1: 'Sucesso!',
                text2: 'Equipamento atualizado!',
                visibilityTime: 3000,
                position: 'top',
            });

            // Reset modal
            setModalVisible(false);
            setIsEditing(false);
            setSelectedPatrimonio(null);

        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-center', alignItems: "center", marginRight: 20 }}>
                <View style={styles.inputContainer}>
                    <Ionicons name="search" size={15} color="gray" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Procurar..."
                        placeholderTextColor={"gray"}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
                <TouchableOpacity>
                    <Ionicons name="filter" size={20} color="gray" style={{ marginRight: 60 }} onPress={() => setFilterModal(true)} />
                </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 6, marginBottom: 5, marginLeft: 75}}>
                {itemCount} item(s) por {selectedCategory}
            </Text>

            <Modal visible={filterModal} transparent={true} animationType="slide">
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecionar categoria:</Text>

                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category.toLowerCase())}
                                style={{
                                    padding: 10,
                                    marginVertical: 5,
                                    backgroundColor: selectedCategory === category.toLowerCase() ? "blue" : "#EEEEEE",
                                    borderRadius: 5,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: selectedCategory === category.toLowerCase() ? "white" : "black" }}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 15, marginBottom: 10 }}>Limpe os filtros para filtrar por patrimônio</Text>
                        {/* Reset Filter Button */}
                        <Button title="Clear Filter" onPress={() => setSelectedCategory("patrimonio")} />

                        {/* Close Modal */}
                        <Button title="Fechar" style={{ color: "red" }} onPress={() => setFilterModal(false)} />
                    </View>
                </View>
            </Modal>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.title}>Patrimônio: {item.patrimonio}</Text>
                            <Text style={styles.item}>Marca: {item.marca}</Text>
                            <Text style={styles.item}>Modelo: {item.modelo}</Text>
                            <Text style={styles.item}>Entradas: {item.entrada}</Text>
                            <Text style={styles.item}>Status: {item.status}</Text>
                            <Text style={styles.item}>Local: {item.local}</Text>
                            <Text style={styles.cardText}>{'\n'}Última edição: {item.editedBy || "Desconhecido"}</Text>
                        </View>
                        <TouchableOpacity style={styles.editbutton} onPress={() => editProduct(item)}>
                            <Ionicons name="create-outline" size={20} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoButton} onPress={() => infoButton(item)}>
                            <Ionicons name="information-circle-outline" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                )}
            />
            {/* Button to open modal */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-outline" size={20} color="white" style={{ alignSelf: "center" }} />
            </TouchableOpacity>

            <Modal visible={infoModal} animationType="slide" transparent={true}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        {selectedItem ? (
                            <>
                                <Text style={styles.title}>Observação do patrimônio {selectedItem.patrimonio}:{'\n'}</Text>
                                <Text style={styles.item}>{selectedItem.observacao}</Text>
                            </>
                        ) : (
                            <Text style={styles.title}>Nenhum item selecionado</Text>
                        )}

                        <TouchableOpacity onPress={() => setInfoModal(false)}>
                            <Text style={{ marginTop: 25, color: "red" }}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for adding new product */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalBackground}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS == "ios" ? "padding" : "height"}
                            style={styles.keyboardView}
                            keyboardVerticalOffset={0}
                        >
                            <ScrollView
                                contentContainerStyle={styles.scrollViewContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={styles.modalContainer}>
                                    <Text style={styles.modalTitle}>{isEditing ? "Editando Equipamento" : "Adicionando Equipmento"}</Text>

                                    <TextInput style={styles.inputAdd} placeholder="Patrimônio ou N/Series" placeholderTextColor="gray" value={patrimonio} onChangeText={setPatrimonio} editable={!isEditing} />
                                    <TextInput style={styles.inputAdd} placeholder="Marca" placeholderTextColor="gray" value={marca} onChangeText={setMarca} />
                                    <TextInput style={styles.inputAdd} placeholder="Modelo" placeholderTextColor="gray" value={modelo} onChangeText={setModelo} />
                                    <TextInput style={styles.inputAdd} placeholder="Entradas" placeholderTextColor="gray" value={entrada} onChangeText={setEntrada} />
                                    <TextInput style={styles.inputAdd} placeholder="Status" placeholderTextColor="gray" value={status} onChangeText={setStatus} />
                                    <TextInput style={styles.inputAdd} placeholder="Local" placeholderTextColor="gray" value={local} onChangeText={setLocal} />
                                    <TextInput style={styles.inputAdd} placeholder="Observação" placeholderTextColor="gray" value={observacao} onChangeText={setObservacao} />

                                    <View style={styles.modalButtons}>
                                        <Button
                                            title="Cancel"
                                            color="red"
                                            onPress={() => {
                                                // Reset input field
                                                setPatrimonio("");
                                                setMarca("");
                                                setModelo("");
                                                setStatus("");
                                                setLocal("");
                                                setObservacao("");
                                                setModalVisible(false);
                                            }}
                                        />
                                        <Button
                                            title={isEditing ? "Update" : "Add"}
                                            onPress={() => {
                                                if (isEditing) {
                                                    updateProduct(); // Call the update function
                                                } else {
                                                    addProduct(); // Call the add function
                                                }
                                                // Reset input field
                                                setPatrimonio("");
                                                setMarca("");
                                                setModelo("");
                                                setStatus("");
                                                setLocal("");
                                                setObservacao("");
                                                setModalVisible(false); // Close modal after action
                                            }}
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    inputContainer: {
        flexDirection: 'row', // Make elements align horizontally
        alignItems: 'center', // Keep everything vertically centered
        justifyContent: 'flex-end',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 15
    },
    addButton: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#007bff",
        padding: 15,
        borderRadius: "100%",
        width: 60,
        height: 60,
        alignItems: "center",
        marginBottom: 10,
        position: "absolute",
        bottom: 20,
        right: 20, // Mantém no canto inferior direito
    },
    addButtonText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    scrollViewContent: {
        padding: 10, // Avoids content sticking to edges
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
    },
    keyboardView: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "90%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold"
    },
    input: {
        marginLeft: 5,
        flex: 1, // Ensures input takes available space
        height: 40,
    },
    inputAdd: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    card: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowColor: "#000",
        shadowOffset: { height: 1, width: 1 },
        position: "relative",
    },
    item: {
        fontSize: 16,
    },
    status: {
        fontSize: 16,
        fontWeight: "bold",
        color: "green",
    },
    editbutton: {
        position: "absolute",
        top: 2,
        right: 10,
        padding: 8,
        borderRadius: 5,
    },
    infoButton: {
        position: "absolute",
        top: 35,
        right: 10,
        padding: 8,
        borderRadius: 5,
    }
});

export default MonitoresScreen;