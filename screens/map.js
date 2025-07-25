// App.js
import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Share,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '@env';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;

const USER_WEIGHT = 65;    // kg
const WALK_MET    = 3.5;   // MET (~5km/h)

const MIN_DELTA = 0.01;    // km (10m)
const MAX_DELTA = 0.2;     // km (200m)
const ACCURACY_THRESHOLD = 20; // m

export default function App() {
  // State
  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);
  const [parks, setParks] = useState([]);
  const [details, setDetails] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavList, setShowFavList] = useState(false);

  const [kmInput, setKmInput] = useState('');
  const [tracking, setTracking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [alertedHalf, setAlertedHalf] = useState(false);
  const [alertedFull, setAlertedFull] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);

  // Refs
  const locationSub = useRef(null);
  const pedometerSub = useRef(null);
  const timerRef = useRef(null);
  const startTimestampRef = useRef(0);
  const initialStepCountRef = useRef(null);

  const mapRef = useRef(null);
  const autoRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;

  // Init
  useEffect(() => {
    AsyncStorage.getItem('favorites')
      .then(json => setFavorites(JSON.parse(json) || []))
      .catch(() => setFavorites([]));

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const initRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initRegion);
      await fetchNearbyVets(initRegion);
      await fetchNearbyParks(initRegion);
    })();

    return () => {
      locationSub.current?.remove();
      pedometerSub.current?.remove();
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [region]);

  // Favorites
  const saveFavorites = async newFavs => {
    setFavorites(newFavs);
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
  };
  const toggleFav = () => {
    if (!details) return;
    const exists = favorites.some(f => f.place_id === details.place_id);
    saveFavorites(
      exists
        ? favorites.filter(f => f.place_id !== details.place_id)
        : [...favorites, details]
    );
  };

  // Nearby searches
  const fetchNearbyVets = async ({ latitude, longitude }) => {
    try {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: '10000',
        type: 'veterinary_care',
        key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
      const { results } = await res.json();
      setPlaces(results || []);
    } catch {
      setPlaces([]);
    }
  };
  const fetchNearbyParks = async ({ latitude, longitude }) => {
    try {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: '10000',
        type: 'park',
        key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
      const { results } = await res.json();
      setParks(results || []);
    } catch {
      setParks([]);
    }
  };

  // Details
  const fetchDetails = async place_id => {
    try {
      const params = new URLSearchParams({
        place_id,
        fields: 'place_id,geometry,name,opening_hours,formatted_address,formatted_phone_number,website,photos,reviews',
        key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
      const { result } = await res.json();
      setDetails(result || {});
      slideAnim.setValue(CARD_HEIGHT);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } catch {
      setDetails(null);
    }
  };
  const closeDetails = () => {
    Animated.timing(slideAnim, { toValue: CARD_HEIGHT, duration: 300, useNativeDriver: true })
      .start(() => setDetails(null));
  };
  const recenter = () => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
    closeDetails();
  };
  const onShare = async () => {
    if (!details) return;
    try {
      await Share.share({
        message: `${details.name}\n${details.formatted_address}\n${details.website}`
      });
    } catch (e) {
      Alert.alert('공유 실패', e.message || '알 수 없는 오류');
    }
  };

  // Haversine
  function haversineKm([lat1, lon1], [lat2, lon2]) {
    const toRad = n => (n * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) *
      Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Stats
  const computeCalories = () => {
    const hours = elapsedMs / (1000*60*60);
    return (USER_WEIGHT * WALK_MET * hours).toFixed(0);
  };
  const formatTime = ms => {
    const total = Math.floor(ms/1000);
    const m = Math.floor(total/60);
    const s = total%60;
    return `${m}분 ${s.toString().padStart(2,'0')}초`;
  };
  const computePace = () => {
    if (distanceKm < 0.01) return '–';
    const pace = Math.floor((elapsedMs/1000)/distanceKm);
    const pm = Math.floor(pace/60);
    const ps = pace%60;
    return `${pm}:${ps.toString().padStart(2,'0')} 분/km`;
  };

  // Tracking controls
  const onPressStart = () => setShowGoalModal(true);
  const confirmGoalAndStart = () => {
    if (isNaN(Number(kmInput))||Number(kmInput)<=0) {
      Alert.alert('오류','유효한 목표 거리를 입력해 주세요.');
      return;
    }
    setShowGoalModal(false);
    startTracking();
  };

  const startTracking = async () => {
    setRouteCoords([]);
    setDistanceKm(0);
    setStepCount(0);
    setElapsedMs(0);
    setAlertedHalf(false);
    setAlertedFull(false);
    setPaused(false);

    startTimestampRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimestampRef.current);
    }, 1000);

    initialStepCountRef.current = null;
    pedometerSub.current = Pedometer.watchStepCount(evt => {
      const steps = evt.steps||0;
      if (initialStepCountRef.current===null) {
        initialStepCountRef.current = steps;
      }
      setStepCount(steps - initialStepCountRef.current);
    });

    const target = Number(kmInput);
    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > ACCURACY_THRESHOLD) return;
        setRouteCoords(rc => {
          if (rc.length>0) {
            const last = rc[rc.length-1];
            const delta = haversineKm(
              [last.latitude,last.longitude],
              [latitude,longitude]
            );
            if (delta>=MIN_DELTA && delta<=MAX_DELTA) {
              setDistanceKm(prev=>{
                const nd = prev+delta;
                if (!alertedHalf && target>0 && nd>=target/2) {
                  Speech.speak('목표 거리의 절반을 달성했습니다. 계속 화이팅!');
                  setAlertedHalf(true);
                }
                if (!alertedFull && target>0 && nd>=target) {
                  const cal = computeCalories();
                  Alert.alert(
                    '목표 완주! 🎉',
                    `${target}km를 달성했습니다.\n소모 칼로리: ${cal} kcal`
                  );
                  Speech.speak('축하합니다! 목표 거리를 달성했습니다.');
                  setAlertedFull(true);
                }
                return nd;
              });
              return [...rc,{latitude,longitude}];
            }
            return rc;
          }
          return [{latitude,longitude}];
        });
      }
    );

    setTracking(true);
  };

  const pauseTracking = () => {
    locationSub.current?.remove();
    pedometerSub.current?.remove();
    clearInterval(timerRef.current);
    setPaused(true);
  };

  const resumeTracking = async () => {
    startTimestampRef.current = Date.now() - elapsedMs;
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimestampRef.current);
    }, 1000);

    pedometerSub.current = Pedometer.watchStepCount(evt => {
      const steps = evt.steps||0;
      setStepCount(steps - initialStepCountRef.current);
    });

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy>ACCURACY_THRESHOLD) return;
        setRouteCoords(rc=>{
          if (rc.length>0) {
            const last = rc[rc.length-1];
            const delta = haversineKm(
              [last.latitude,last.longitude],
              [latitude,longitude]
            );
            if (delta>=MIN_DELTA && delta<=MAX_DELTA) {
              setDistanceKm(prev=>prev+delta);
              return [...rc,{latitude,longitude}];
            }
            return rc;
          }
          return [{latitude,longitude}];
        });
      }
    );

    setPaused(false);
  };

  const stopTracking = () => {
    pauseTracking();
    setTracking(false);
  };

  // Render
  if (!region) {
    return <ActivityIndicator style={styles.center} size="large" />;
  }

  const remaining = kmInput
    ? Math.max(0, Number(kmInput)-distanceKm).toFixed(2)
    : null;
  const progress = kmInput
    ? Math.min(1, distanceKm/Number(kmInput))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrapper}>
          <GooglePlacesAutocomplete
            ref={autoRef}
            placeholder="검색"
            fetchDetails
            onPress={async (_, detail) => {
              const lat = detail?.geometry?.location?.lat ?? region.latitude;
              const lng = detail?.geometry?.location?.lng ?? region.longitude;
              const newR = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
              };
              setRegion(newR);
              await fetchNearbyVets(newR);
              await fetchNearbyParks(newR);
              closeDetails();
            }}
            query={{
              key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
              language: 'ko',
              types: 'establishment',
              location: `${region.latitude},${region.longitude}`,
              radius: 10000,
            }}
            nearbyPlacesAPI="GooglePlacesSearch"
            predefinedPlaces={[]}
            debounce={300}
            enablePoweredByContainer={false}
            textInputProps={{ onFocus: ()=>{}, onBlur: ()=>{} }}
            styles={{
              container: { flex: 1 },
              textInputContainer: styles.searchInputContainer,
              textInput: styles.searchInput,
              listView: { backgroundColor: '#fff', borderRadius: 6, overflow: 'hidden' },
            }} />
          <TouchableOpacity style={styles.favListBtn} onPress={()=>setShowFavList(true)}>
            <Text style={styles.favListBtnText}>⭐</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.locationBtn} onPress={recenter}>
          <Text style={styles.locationBtnText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Map & Route */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        onPress={closeDetails}
      >
        {places.map(p=>(
          <Marker
            key={p.place_id}
            coordinate={{ latitude: p.geometry.location.lat, longitude: p.geometry.location.lng }}
            onPress={()=>fetchDetails(p.place_id)}>
            <Text style={styles.marker}>🏥</Text>
          </Marker>
        ))}
        {parks.map(p=>(
          <Marker
            key={p.place_id}
            coordinate={{ latitude: p.geometry.location.lat, longitude: p.geometry.location.lng }}
            onPress={()=>fetchDetails(p.place_id)}>
            <Text style={styles.marker}>🌳</Text>
          </Marker>
        ))}
        {routeCoords.length>1 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#4A90E2" />
        )}
      </MapView>

      {/* Controls */}
      <View style={styles.controlRow}>
        {!tracking && (
          <TouchableOpacity style={styles.trackBtn} onPress={onPressStart}>
            <Text style={styles.trackBtnText}>산책 시작</Text>
          </TouchableOpacity>
        )}
        {tracking && !paused && (
          <TouchableOpacity style={[styles.trackBtn, styles.pauseBtn]} onPress={pauseTracking}>
            <Text style={styles.trackBtnText}>일시정지</Text>
          </TouchableOpacity>
        )}
        {tracking && paused && (
          <TouchableOpacity style={[styles.trackBtn, styles.resumeBtn]} onPress={resumeTracking}>
            <Text style={styles.trackBtnText}>재개</Text>
          </TouchableOpacity>
        )}
        {tracking && (
          <TouchableOpacity style={[styles.trackBtn, styles.stopBtn]} onPress={stopTracking}>
            <Text style={styles.trackBtnText}>종료</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {tracking && kmInput && (
        <View style={styles.progressWrapper}>
          <View style={[styles.progressBarFill, { width: `${(progress*100).toFixed(0)}%` }]} />
        </View>
      )}

      {/* Stats */}
      {tracking && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>⏱ {formatTime(elapsedMs)}</Text>
          <Text style={styles.statsText}>🚶‍♂️ {stepCount} 걸음</Text>
          <Text style={styles.statsText}>🏃‍♂️ {computePace()}</Text>
          {kmInput && <Text style={styles.statsText}>📏 남은: {remaining} km</Text>}
        </View>
      )}

      {/* Detail Card */}
      {details && (
        <Animated.View style={[styles.details, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={closeDetails}>
                <Text style={styles.closeBtn}>✖️</Text>
              </TouchableOpacity>
              <Text style={[styles.placeName, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{details.name}</Text>
              <TouchableOpacity onPress={toggleFav}>
                <Text style={styles.favBtn}>{favorites.some(f=>f.place_id===details.place_id)?'❤️':'🤍'}</Text>
              </TouchableOpacity>
            </View>
            {details.photos?.length>0 && (
              <ScrollView horizontal style={styles.photoScroll} showsHorizontalScrollIndicator={false}>
                {details.photos.map((ph,i)=>(
                  <Image key={i} source={{ uri:`https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${ph.photo_reference}&key=${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}` }} style={styles.photo} />
                ))}
              </ScrollView>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 주소</Text>
              <Text style={styles.value}>{details.formatted_address}</Text>
            </View>
            {details.formatted_phone_number && (
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>📞 전화</Text>
                <TouchableOpacity onPress={()=>Linking.openURL(`tel:${details.formatted_phone_number}`)}>
                  <Text style={[styles.value,styles.link]}>{details.formatted_phone_number}</Text>
                </TouchableOpacity>
              </View>
            )}
            {details.website && (
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>🔗 웹</Text>
                <TouchableOpacity onPress={()=>Linking.openURL(details.website)}>
                  <Text style={[styles.value,styles.link]}>홈페이지</Text>
                </TouchableOpacity>
              </View>
            )}
            {details.opening_hours?.weekday_text && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ 시간</Text>
                {details.opening_hours.weekday_text.map((t,i)=>(
                  <Text key={i} style={styles.value}>{t}</Text>
                ))}
              </View>
            )}
            {details.reviews?.length>0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💬 리뷰</Text>
                {details.reviews.slice(0,3).map((r,i)=>(
                  <View key={i} style={styles.review}>
                    <Text style={styles.reviewAuthor}>{r.author_name} ({r.rating}⭐)</Text>
                    <Text style={styles.value}>{r.text}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⌛ 대기시간</Text>
              <Text style={styles.value}>약 {Math.floor(Math.random()*30)+5}분</Text>
            </View>
            <View style={styles.actionRow}>
              {details.formatted_phone_number && (
                <TouchableOpacity style={styles.btn} onPress={()=>Linking.openURL(`tel:${details.formatted_phone_number}`)}>
                  <Text style={styles.btnText}>☎️ 전화</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btn} onPress={onShare}>
                <Text style={styles.btnText}>🔗 공유</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Favorites Modal */}
      <Modal visible={showFavList} transparent animationType="slide" onRequestClose={()=>setShowFavList(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⭐ 즐겨찾기 목록</Text>
            <ScrollView>
              {favorites.map(p=>(
                <TouchableOpacity key={p.place_id} style={styles.favItem} onPress={async()=>{
                  const lat=p.geometry.location.lat, lng=p.geometry.location.lng;
                  const nr={latitude:lat,longitude:lng,latitudeDelta:0.1,longitudeDelta:0.1};
                  setRegion(nr);
                  await fetchNearbyVets(nr);
                  await fetchNearbyParks(nr);
                  setShowFavList(false);
                  closeDetails();
                }}>
                  <Text style={styles.favItemText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
              {favorites.length===0 && <Text style={styles.emptyText}>즐겨찾기가 없습니다.</Text>}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={()=>setShowFavList(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade" onRequestClose={()=>setShowGoalModal(false)}>
        <View style={styles.goalModalBackdrop}>
          <View style={styles.goalModalContent}>
            <Text style={styles.modalTitle}>목표 거리 설정</Text>
            <TextInput
              style={styles.goalInput}
              placeholder="목표 거리 (km)"
              keyboardType="numeric"
              onChangeText={setKmInput}
              value={kmInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={confirmGoalAndStart}>
                <Text style={styles.modalBtnText}>확인</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn,styles.modalCancelBtn]} onPress={()=>setShowGoalModal(false)}>
                <Text style={styles.modalBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar:           { position: 'absolute', top: 40, left: 10, right: 10, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchWrapper:    { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, elevation: 4, alignItems: 'center', paddingHorizontal: 8, marginRight: 8 },
  searchInputContainer:{ backgroundColor:'#fff',borderRadius:6,paddingHorizontal:4 },
  searchInput:      { fontSize: 14, height: 40 },
  favListBtn:       { marginLeft: 8, padding: 6, backgroundColor: '#fff', borderRadius: 6, elevation: 4 },
  favListBtnText:   { fontSize: 18 },
  locationBtn:      { backgroundColor: '#4A90E2', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, elevation: 4 },
  locationBtnText:  { color: '#fff', fontSize: 14, fontWeight: '500' },

  map:              { flex: 1 },
  marker:           { fontSize: 24 },

  controlRow:       { position: 'absolute', top: 100, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-around', zIndex: 20 },
  trackBtn:         { backgroundColor: '#4A90E2', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, elevation: 4 },
  pauseBtn:         { backgroundColor: '#FFA500' },
  resumeBtn:        { backgroundColor: '#28a745' },
  stopBtn:          { backgroundColor: '#D9534F' },
  trackBtnText:     { color: '#fff', fontSize: 14, fontWeight: '600' },

  progressWrapper:  { position: 'absolute', top: 150, left: 20, right: 20, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', zIndex: 20 },
  progressBarFill:  { height: 8, backgroundColor: '#4A90E2' },

  statsContainer:   { position: 'absolute', bottom: 20, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8, elevation: 4, zIndex: 10 },
  statsText:        { color: '#fff', fontSize: 14, marginBottom: 4 },

  details:          { position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_HEIGHT, backgroundColor: '#fff', elevation: 6, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, zIndex: 10 },
  headerRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  closeBtn:         { fontSize: 22, color: '#333' },
  placeName:        { fontSize: 20, fontWeight: '700', color: '#333' },
  favBtn:           { fontSize: 26 },
  photoScroll:      { marginVertical: 8 },
  photo:            { width: 160, height: 100, borderRadius: 8, marginRight: 8 },
  section:          { marginVertical: 8 },
  sectionTitle:     {	fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 4 },
  sectionRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  value:            { flex: 1, color: '#444', fontSize: 14 },
  link:             { color: '#4A90E2', textDecorationLine: 'underline' },
  review:           { marginBottom: 8, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 8 },
  reviewAuthor:     { fontWeight: '600', marginBottom: 4 },
  actionRow:        { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  btn:              { backgroundColor: '#4A90E2', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, elevation: 4 },
  btnText:          { color: '#fff', fontSize: 14 },

  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent:     { width: '80%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle:       { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  favItem:          { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  favItemText:      { fontSize: 16 },
  emptyText:        { textAlign: 'center', marginTop: 20, color: '#666' },
  modalClose:       { marginTop: 12, alignSelf: 'center', backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 },
  modalCloseText:   { color: '#fff', fontSize: 14 },

  goalModalBackdrop:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  goalModalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 6 },
  goalInput:        { height: 44, backgroundColor: '#f2f2f2', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginBottom: 16 },
  modalButtons:     { flexDirection: 'row', justifyContent: 'space-around' },
  modalBtn:         { backgroundColor: '#4A90E2', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalCancelBtn:   { backgroundColor: '#D9534F' },
  modalBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
});
