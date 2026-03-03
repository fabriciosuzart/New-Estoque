import React from 'react';
import { ScrollView } from 'react-native';
import DynamicButton from "../components/Buttons";

export default function LocaisEstoque() {
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", alignItems: "center", marginTop: 10}}>
            <DynamicButton
                title="Computadores" 
                icon={require('../assets/images/computador.png')} 
                screen="ProductListScreen" 
            />
            <DynamicButton
                title="Monitores" 
                icon={require('../assets/images/monitor.png')} 
                screen="MonitoresScreen" 
            />   
            <DynamicButton
                title="Estabilizadores & Nobreaks" 
                icon={require('../assets/images/estabilizador.png')} 
                screen="EstabilizadorScreen" 
            /> 
            <DynamicButton
                title="Periféricos" 
                icon={require('../assets/images/perifericos.png')} 
                screen="PerifericosScreen" 
            />   
        </ScrollView>
    );
}
