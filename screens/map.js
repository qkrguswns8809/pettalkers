import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, Alert, 
  StyleSheet, Animated 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { EXPO_PUBLIC_GOOGLE_API_KEY } from '@env';

const apiKey = EXPO_PUBLIC_GOOGLE_API_KEY;

const Map = () => {
  const [coordinates, setCoordinates] = useState({
    latitude: 37.5665, // 기본 좌표 (서울)
    longitude: 126.9780,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [veterinaryClinics, setVeterinaryClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [destination, setDestination] = useState(null);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한을 허용해주세요');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setCoordinates(newCoordinates);
      mapRef.current?.animateToRegion(newCoordinates, 1000);
      fetchNearbyVeterinaryClinics(newCoordinates);
    } catch (error) {
      Alert.alert('현재 위치를 가져올 수 없습니다.');
    }
  };

  const fetchNearbyVeterinaryClinics = async (location) => {
    try {
      if (!location) return;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000&type=veterinary_care&key=${apiKey}`;
      const response = await axios.get(url);
      console.log(response.data); // API 응답 확인
      if (response.data.status === 'OK') {
        setVeterinaryClinics(response.data.results);
      } else {
        Alert.alert('동물병원 정보를 가져오는 데 실패했습니다');
      }
    } catch (error) {
      console.error(error); // 오류 로그 출력
      Alert.alert('근처 동물병원 정보를 가져오는 중 오류 발생');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredClinics([]); // 검색어가 비었을 때는 결과 초기화
      return;
    }
    const filtered = veterinaryClinics
      .filter(clinic => clinic.name.toLowerCase().includes(searchQuery.toLowerCase())) // 대소문자 구분 없이 검색
      .sort((a, b) => a.geometry.location.lat - b.geometry.location.lat)
      .slice(0, 5);
    setFilteredClinics(filtered);
  };

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setDestination({
      latitude: clinic.geometry.location.lat,
      longitude: clinic.geometry.location.lng,
    });
    mapRef.current?.animateToRegion({
      latitude: clinic.geometry.location.lat,
      longitude: clinic.geometry.location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
    }).start();
  };

  useEffect(() => {
    if (selectedClinic) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [selectedClinic]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="동물병원 이름을 입력하세요"
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={{ color: 'white' }}>검색</Text>
        </TouchableOpacity>
      </View>

      {filteredClinics.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={filteredClinics}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectClinic(item)}>
                <Text style={styles.searchItem}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <MapView 
        ref={mapRef} 
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={coordinates}
      >
        {coordinates && <Marker coordinate={coordinates} title="내 위치" pinColor="red" />}
        {veterinaryClinics.map((clinic) => (
          <Marker
            key={clinic.place_id}
            coordinate={{
              latitude: clinic.geometry.location.lat,
              longitude: clinic.geometry.location.lng,
            }}
            title={clinic.name}
            onPress={() => handleSelectClinic(clinic)}
            pinColor="blue"
          />
        ))}
        {coordinates && destination && (
          <MapViewDirections
            origin={coordinates}
            destination={destination}
            apikey={apiKey}
            mode="DRIVING"
            strokeWidth={6}
            strokeColor="#3498db"
          />
        )}
      </MapView>

      <Animated.View style={[styles.hospitalDetails, { transform: [{ translateY: slideAnim }] }]}>  
        {selectedClinic && (
          <>
            <Text style={styles.hospitalName}>{selectedClinic.name}</Text>
            <Text>평점: {selectedClinic.rating || '정보 없음'}</Text>
            <Text>주소: {selectedClinic.vicinity}</Text>
            <TouchableOpacity onPress={() => setSelectedClinic(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#3498db',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    zIndex: 1,
  },
  searchItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  hospitalDetails: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowOpacity: 0.2,
    elevation: 5,
    alignItems: 'center',
  },
  hospitalName: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { marginTop: 10, padding: 10, backgroundColor: 'red', borderRadius: 5 },
  closeButtonText: { color: 'white' },
});

export default Map;
