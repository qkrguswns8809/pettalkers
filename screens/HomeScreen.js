import {
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  Linking,
  View,
  Image,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Swiper from 'react-native-swiper';
import { auth } from '../firebase-config';

const { width } = Dimensions.get('window');

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

  const slideImages = [
    {
      uri: 'https://images.pet-friends.co.kr/storage/pet_friends/tab_banner/7/2/0/8/3/8/f/720838fdef440142be95d95c1929ad27/10000/e6bce2f033cc145437388906dc31d538.png?f=webp&w=720&q=80',
      link: 'https://m.pet-friends.co.kr/main/tab/2',
    },
    {
      uri: 'https://m.smilepet.co.kr/web/upload/m-images/m_main_banner_03.jpg',
      link: 'https://smilepet.co.kr/',
    },
    {
      uri: 'https://cdn.e2news.com/news/photo/202506/320810_219402_3921.jpg',
      link: 'https://pawinhand.kr/',
    },
  ];

  const circleImages = [
    {
      uri: 'https://media.istockphoto.com/id/1339851357/vector/dog-icon-vector-isolated-funny-puppy-head-pictogram-on-white-background.jpg?s=612x612&w=0&k=20&c=mOqd-O-dtpKjUhR52McMA8ifM-AY8H3BmJvJtgtB_ZE=',
      label: '개',
      link: 'https://www.dogpang.com/?srsltid=AfmBOoqWx_G010kBZvlK0GCQdOi7GB2YJUykoj5iaRcGKrEcTru4F-TQ',
    },
    {
      uri: 'https://www.creativefabrica.com/wp-content/uploads/2021/01/26/Cat-Icon-Graphics-8071439-1.jpg',
      label: '고양이',
      link: 'https://www.catpang.com/?srsltid=AfmBOopixpYG7Ym2fgz0T3F8JK_iE7sAQ5rXIxhRhsJkiJXh0YFyoKlJ',
    },
    {
      uri: 'https://img.freepik.com/premium-vector/dog-toy-food-bone-icon_71328-564.jpg',
      label: '기타',
      link: 'https://m.pet-friends.co.kr/main/tab/2',
    },
  ];

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error('링크 오류:', err));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 슬라이드 */}
      <View style={styles.swiperWrapper}>
        <Swiper
          autoplay
          autoplayTimeout={3}
          showsPagination
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        >
          {slideImages.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => openLink(item.link)} activeOpacity={0.8}>
              <Image
                source={{ uri: item.uri }}
                style={styles.slideImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </Swiper>
      </View>

      {/* 동그란 이미지 링크 추가 */}
      <View style={styles.circleImageRow}>
        {circleImages.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.circleImageContainer}
            activeOpacity={0.7}
            onPress={() => openLink(item.link)}
          >
            <Image source={{ uri: item.uri }} style={styles.circleImage} />
            <Text style={styles.circleImageLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
    fontWeight: 'bold',
  },
  swiperWrapper: {
    height: 200,
    width: '100%',
    marginBottom: 30,
  },
  slideImage: {
    width: width - 40,
    height: 200,
    borderRadius: 10,
    marginRight: 20,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  circleImageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  circleImageContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circleImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  circleImageLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
