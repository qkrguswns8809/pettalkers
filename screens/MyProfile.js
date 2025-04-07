import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal } from 'react-native';
import { auth, db } from '../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('로그인 필요', '로그인이 필요합니다.');
        navigation.navigate('Login');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setName(userData.name || '');
        setPhone(userData.phone || '');
      }
    };

    fetchUserInfo();
  }, []);

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), { name, phone }, { merge: true });
      setIsEditing(false);
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
    } catch (error) {
      Alert.alert('에러', '프로필을 저장하는 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>내 프로필</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>이메일: {auth.currentUser?.email || '정보 없음'}</Text>
        <Text style={styles.infoText}>이름: {name || '미입력'}</Text>
        <Text style={styles.infoText}>전화번호: {phone || '미입력'}</Text>
        <Button title="수정" onPress={() => setIsEditing(true)} />
      </View>

      <Modal visible={isEditing} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.header}>프로필 수정</Text>
            <TextInput
              style={styles.textInput}
              placeholder="이름"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.textInput}
              placeholder="전화번호"
              value={phone}
              onChangeText={setPhone}
            />
            <Button title="저장" onPress={handleSaveProfile} />
            <Button title="취소" onPress={() => setIsEditing(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});
