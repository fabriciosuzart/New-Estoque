import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants'; 
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, 
      shouldShowList: true,  
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações foi negada!');
      return null;
    }
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
        console.log('Erro: Project ID não encontrado no app.json');
        return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
    })).data;
    
    console.log("Token do Aparelho gerado com sucesso:", token);
  } else {
    console.log('Notificações Push precisam de um iPhone ou Android físico (não funciona em emulador)');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function sendPushNotification(expoPushToken, title, body) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { someData: 'goes here' }, 
    };
  
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      console.log("Notificação enviada para a fila da Expo!");
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  }