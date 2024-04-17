import {NavigationProp} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useRecoilValue, useResetRecoilState} from 'recoil';

import {hasTokenSelector, tokenState} from '../../atoms';
import {NavParams} from '../../navigation';

interface Props {
  navigation: NavigationProp<NavParams, 'Home'>;
}

export const Home = ({navigation}: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {navigate} = navigation;
  const hasToken = useRecoilValue(hasTokenSelector);
  const resetToken = useResetRecoilState(tokenState);

  const login = () => {
    console.log('login');
  };
  const gotoProfile = () => navigate('Profile');

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
          <Text className="mb-1 text-xs text-[#1999ff]">
            SIGN IN WITH ACCOUNT NAME
          </Text>
          <TextInput
            className="bg-input h-10 w-full items-center justify-center rounded p-2 text-white"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <Text className="mb-1 mt-4 text-xs text-[#afafaf]">PASSWORD</Text>
          <TextInput
            className="bg-input h-10 w-full items-center justify-center rounded p-2 text-white"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            className="bg-blueStart mb-40 mt-6 h-10 w-full items-center justify-center rounded"
            onPress={login}>
            <Text className="text-lg text-white">Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};
