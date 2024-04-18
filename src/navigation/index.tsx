import {createStackNavigator} from '@react-navigation/stack';
import {Home, Inventory, Login} from '../screens';

type StackParams = {
  Home: undefined;
  Login: undefined;
  Inventory: undefined;
};

const Stack = createStackNavigator<StackParams>();

export const StackNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="Inventory" component={Inventory} />
    </Stack.Navigator>
  );
};

export type NavParams = StackParams;
