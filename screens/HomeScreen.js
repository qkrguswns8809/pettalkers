import { Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ImageBackground } from 'react-native';
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';

export default function HomeScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleChatNavigation = () => {
    if (isLoggedIn) {
      navigation.navigate('Chat');
    } else {
      Alert.alert('로그인 필요', '실시간 채팅을 이용하려면 로그인해야 합니다.');
    }
  };

  const CustomButton = ({ title, onPress, imageSource }) => (
    <TouchableOpacity style={styles.buttonWrapper} onPress={onPress}>
      <ImageBackground
        source={imageSource}
        resizeMode="cover"
        style={styles.button}
        imageStyle={{ borderRadius: 10 }}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>오늘의 날씨를 확인해 보세요</Text>
      <CustomButton
        title="오늘의 날씨"
        onPress={() => navigation.navigate('Weather')}
        imageSource={require('../assets/images/weather.jpg')}
      />

      <Text style={styles.title}>사람들과 실시간으로 소통해보세요</Text>
      <CustomButton
        title="실시간 채팅"
        onPress={handleChatNavigation}
        imageSource={require('../assets/images/livechat.jpg')}
      />

      <Text style={styles.title}>반려동물의 대한정보들을 물어보세요</Text>
      <CustomButton
        title="AI 상담"
        onPress={() => navigation.navigate('GPTChat')}
        imageSource={require('../assets/images/chatbot.jpg')}
      />

      <Text style={styles.title}>반려동물과 게임을 해봐요</Text>
      <CustomButton
        title="게임 시작하기"
        onPress={() => navigation.navigate('Game')}
        imageSource={require('../assets/images/game.jpg')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'gray',
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  button: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonText: {
    color: 'gray',
    fontSize: 18,
    fontWeight:'bold'
  },
});
