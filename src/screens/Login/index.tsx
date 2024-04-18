import CookieManager from '@react-native-cookies/cookies';
import {NavigationProp} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {Pressable, Text, View} from 'react-native';
import WebView from 'react-native-webview';
import {useRecoilState} from 'recoil';
import {cookieState} from '../../atoms';
import {NavParams} from '../../navigation';

interface Props {
  navigation: NavigationProp<NavParams, 'Profile'>;
}

export const Login = ({navigation}: Props) => {
  const {goBack} = navigation;
  const [cookie, setCookie] = useRecoilState(cookieState);

  useEffect(() => {
    if (cookie) {
      CookieManager.get('https://steamcommunity.com', true)
        .then(fullCookies => {
          const cookieString = Object.values(fullCookies).reduce(
            (acc, cookie) => {
              return acc + `${cookie.name}=${cookie.value}; `;
            },
            '',
          );
          console.log(JSON.stringify(fullCookies, null, 2));
          setCookie(cookieString);
        })
        .catch(console.error);
    }
  }, [cookie]);

  return (
    <View className="flex-1">
      <View className="h-12 flex-row items-center justify-between bg-black px-4">
        <View className="w-8"></View>
        <Text className="text-white">Login</Text>
        <Pressable
          className="h-8 w-8 items-end justify-center"
          onPress={goBack}>
          <Text className="text-xs text-gray-200">Close</Text>
        </Pressable>
      </View>

      <WebView
        injectedJavaScript="window.ReactNativeWebView.postMessage(document.cookie)"
        className="flex-1"
        scalesPageToFit={false}
        incognito={false}
        onNavigationStateChange={navState => {
          console.log('navState', navState);
        }}
        source={{uri: 'https://store.steampowered.com/login/'}}
        onMessage={event => {
          setCookie(event.nativeEvent.data);
        }}
      />
    </View>
  );
};
