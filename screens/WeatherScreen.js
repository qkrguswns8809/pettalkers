// WeatherScreen.js

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { WEATHER_API_KEY, EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '@env';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const petCareTips = {
  clear: "오늘은 맑아요! 반려동물과 산책하기 좋은 날이에요.",
  clouds: "구름이 많아요. 반려동물이 불안해할 수 있어요.",
  rain: "비가 많이 와요! 반려동물을 실내에서 보호해주세요.",
  thunderstorm: "천둥번개가 칩니다. 반려동물이 무서워할 수 있어요!",
  snow: "눈이 내려요! 발바닥 보호를 위해 신발을 신겨주세요.",
  mist: "안개가 껴서 시야가 나빠요. 산책 시 주의하세요."
};

const getTemperatureTip = (temp) => {
  if (temp >= 30) return "더운 날이에요! 반려동물이 더위를 먹지 않도록 충분한 물을 주세요.";
  if (temp >= 20) return "적당한 기온이에요! 산책하기 딱 좋은 날이에요.";
  if (temp >= 10) return "조금 쌀쌀해요. 반려동물이 추위를 느낄 수 있어요.";
  return "추운 날이에요! 반려동물이 따뜻하게 지낼 수 있도록 해주세요.";
};

export default function WeatherScreen() {
  const [city, setCity] = useState("");
  const [dailyWeather, setDailyWeather] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchLocationAndWeather = async () => {
    try {
      // 1) 위치 권한 요청
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setErrorMsg("위치 권한이 거부되었습니다.");
        return;
      }

      // 2) 현재 위치 얻기
      const {
        coords: { latitude, longitude }
      } = await Location.getCurrentPositionAsync({ accuracy: 5 });

      // 3) 구글 Geocoding API로 역지오코딩
      const geocodeUrl = [
        `https://maps.googleapis.com/maps/api/geocode/json`,
        `?latlng=${latitude},${longitude}`,
        `&language=ko`,
        `&key=${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      ].join('');
      const geoResp = await fetch(geocodeUrl);
      const geoJson = await geoResp.json();
      const cityComponent = geoJson.results
        .flatMap(r => r.address_components)
        .find(c =>
          c.types.includes("locality") ||
          c.types.includes("administrative_area_level_1")
        );
      setCity(cityComponent?.long_name ?? "");

      // 4) OpenWeatherMap One Call API로 날씨 데이터 가져오기
      const weatherUrl = [
        `https://api.openweathermap.org/data/3.0/onecall?`,
        `lat=${latitude}&lon=${longitude}`,
        `&exclude=alerts&units=metric&lang=kr`,
        `&appid=${WEATHER_API_KEY}`
      ].join('');
      const resp = await fetch(weatherUrl);
      const json = await resp.json();
      setDailyWeather(Array.isArray(json.daily) ? json.daily : []);
    } catch (e) {
      console.error(e);
      setErrorMsg("정보를 가져오는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchLocationAndWeather();
  }, []);

  const list = Array.isArray(dailyWeather) ? dailyWeather : [];

  return (
    <View style={styles.container}>
      <View style={styles.cityCon}>
        <Text style={styles.city}>
          {city || "위치 정보를 가져오는 중..."}
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weather}
      >
        {list.length === 0 ? (
          <View style={styles.weatherInner}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          list.map((day, index) => (
            <View key={index} style={styles.weatherInner}>
              <View style={styles.day}>
                <Text style={styles.desc}>
                  {day.weather?.[0]?.description ?? "-"}
                </Text>
              </View>

              <View style={styles.tempCon}>
                <Text style={styles.temp}>
                  {parseFloat(day.temp?.day ?? 0).toFixed(0)}°
                </Text>
              </View>

              <View style={styles.petTipCon}>
                <Text style={styles.petTip}>
                  {petCareTips[
                    day.weather?.[0]?.main.toLowerCase()
                  ] || "오늘도 반려동물과 즐거운 하루 보내세요!"}
                </Text>
                <Text style={styles.petTip}>
                  {getTemperatureTip(day.temp?.day ?? 0)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <StatusBar style="auto" />

      {errorMsg ? (
        <View style={styles.errorCon}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffe01a' },
  cityCon: { flex: 0.4 },
  city: {
    flex: 1,
    marginTop: 70,
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  weather: {},
  weatherInner: { flex: 3, width: SCREEN_WIDTH, justifyContent: 'center' },
  day: { flex: 0.2, alignItems: 'center', justifyContent: 'center' },
  desc: { flex: 1.5, marginTop: 20, fontWeight: 'bold', fontSize: 30 },
  tempCon: { flex: 0.5, alignItems: 'center' },
  temp: { fontSize: 120 },
  petTipCon: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10
  },
  petTip: { fontSize: 18, color: 'white', textAlign: 'center', fontWeight: 'bold' },
  errorCon: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center'
  },
  errorText: { color: 'red', fontWeight: 'bold' }
});
