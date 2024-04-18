import {NavigationProp} from '@react-navigation/native';
import React from 'react';
import {Image, Pressable, SafeAreaView, Text, View} from 'react-native';
import {useRecoilValue} from 'recoil';

import {cookieState} from '../../atoms';
import {NavParams} from '../../navigation';

interface Props {
  navigation: NavigationProp<NavParams, 'Inventory'>;
}

export const Inventory = ({navigation}: Props) => {
  /* const [username, setUsername] = useState('');
   * const [password, setPassword] = useState(''); */
  const {navigate} = navigation;
  const cookie = useRecoilValue(cookieState);
  /* const resetToken = useResetRecoilState(tokenState); */

  const getInventory = () => {
    fetch('https://steamcommunity.com/inventory/json/730/2')
      .then(res => res.json())
      .then(res => {
        console.log(res);
      })
      .catch(console.error);
    console.log('getInventory');
  };

  return (
    <View className="bg-dark flex-1">
      <SafeAreaView className="flex flex-1 items-center">
        <View className="bg-dark items-center justify-start">
          <Image
            className="h-8 w-36"
            source={require('../../../assets/images/logo.png')}
          />
        </View>
        <View className="mb-4 flex w-64 flex-1 items-start justify-center">
          <Text className="mb-1 mt-4 text-xs text-[#afafaf]">
            cookie: {cookie}
          </Text>
          <Pressable
            className="h-8 w-8 items-end justify-center"
            onPress={getInventory}>
            <Text className="text-xs text-gray-200">Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};
