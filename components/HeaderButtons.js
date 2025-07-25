import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase-config'; // Firestore 추가
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore에서 데이터 가져오기 및 업데이트
import { onSnapshot } from 'firebase/firestore';


const HeaderButtons = () => {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState('Bronze'); // 기본 등급
  const navigation = useNavigation();

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // 포인트에 따른 등급 계산 함수
  const getRank = (points) => {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Bronze';
  };

  // Firestore에서 유저 데이터 가져오기
  useEffect(() => {
    let unsubscribe;
  
    const fetchUserData = async (uid) => {
      try {
        const userRef = doc(db, 'users', uid);
        
        unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userPoints = docSnap.data().points || 0;
            const newRank = getRank(userPoints);
  
            setPoints(userPoints);
            setRank(newRank);
          }
        });
      } catch (error) {
        console.error('유저 데이터 가져오기 오류:', error);
      }
    };
  
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Firestore에 등급 업데이트
  const updateUserRank = async (uid, points) => {
    const newRank = getRank(points);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { rank: newRank }); // Firestore에 등급 업데이트
    } catch (error) {
      console.error('등급 업데이트 오류:', error);
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPoints(0);
      setRank('Bronze');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <View style={styles.headerButtons}>
      {user ? (
        <>
          <Text style={styles.email}>{user.email} ({rank})</Text>
          <Text style={styles.points}>포인트: {points}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.headerButton}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.headerButton}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.headerButton}>회원가입</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10 },
  headerButton: { fontSize: 16, color: '#1a73e8', marginLeft: 10 },
  email: { fontSize: 16, color: '#000', marginRight: 10, fontWeight: 'bold' },
  points: { fontSize: 14, color: '#666', marginRight: 10 },
});

export default HeaderButtons;
