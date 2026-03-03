import { createDrawerNavigator, DrawerContentScrollView, DrawerItem} from '@react-navigation/drawer'
import { Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

import StackRoutes from './stack.routes';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem 
        label="GLPI" 
        onPress={() => Linking.openURL("https://helpdesk.unisanta.br")} 
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerRoutes() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />} 
      screenOptions={{
        drawerStyle: { backgroundColor: "#fff", width: 240 },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="menu"
        component={StackRoutes}
        options={{
          title: "Menu",
          drawerIcon: ({ color, size }) => <Feather name="menu" color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}