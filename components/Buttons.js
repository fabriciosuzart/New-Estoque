import React from "react";
import { View, FlatList, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from '@react-navigation/native';

const DynamicButton = ({ title, icon, screen }) => {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate(screen);
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress}>
            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{title}</Text>
            </View>
            <Image source={icon} style={styles.icon} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#008CBA',
        paddingHorizontal: 10,
        marginVertical: 8, //top e baixo
        borderRadius: 15,
        width: 370,
        height: 120,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row'
    },
    title: {
        fontSize: 25,
        color: '#fff',
        flexWrap: 'wrap',
    },
    icon: {
        width: 50,
        height: 50,
    }
})

export default DynamicButton;