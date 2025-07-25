import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [petType, setPetType] = useState('개');
  const [petExperience, setPetExperience] = useState('1년 미만');
  const [walkTime, setWalkTime] = useState('15분 이하');
  const [petGender, setPetGender] = useState('수컷');
  const [hasInsurance, setHasInsurance] = useState('예');
  const [adoptionRoute, setAdoptionRoute] = useState('펫샵');
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
        setPetType(userData.petType || '개');
        setPetExperience(userData.petExperience || '1년 미만');
        setWalkTime(userData.walkTime || '15분 이하');
        setPetGender(userData.petGender || '수컷');
        setHasInsurance(userData.hasInsurance || '예');
        setAdoptionRoute(userData.adoptionRoute || '펫샵');
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
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name,
          phone,
          petType,
          petExperience,
          walkTime,
          petGender,
          hasInsurance,
          adoptionRoute,
        },
        { merge: true }
      );
      setIsEditing(false);
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
    } catch {
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
        <Text style={styles.infoText}>반려동물 종류: {petType || '미입력'}</Text>
        <Text style={styles.infoText}>반려동물 성별: {petGender || '미입력'}</Text>
        <Text style={styles.infoText}>키운 기간: {petExperience || '미입력'}</Text>
        <Text style={styles.infoText}>하루 산책 시간: {walkTime || '미입력'}</Text>
        <Text style={styles.infoText}>보험 가입 여부: {hasInsurance || '미입력'}</Text>
        <Text style={styles.infoText}>입양 경로: {adoptionRoute || '미입력'}</Text>
        <Button title="수정" onPress={() => setIsEditing(true)} />
      </View>

      <Modal visible={isEditing} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalView}>
            <Text style={styles.header}>프로필 수정</Text>

            <View style={styles.inputRow}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.textInput}
                placeholder="이름"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput
                style={styles.textInput}
                placeholder="전화번호"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>반려동물 종류</Text>
              <Picker
                selectedValue={petType}
                onValueChange={setPetType}
                style={styles.picker}
              >
                <Picker.Item label="개" value="개" />
                <Picker.Item label="고양이" value="고양이" />
                <Picker.Item label="기타" value="기타" />
                <Picker.Item label="없음" value="없음" />
              </Picker>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>반려동물 성별</Text>
              <Picker
                selectedValue={petGender}
                onValueChange={setPetGender}
                style={styles.picker}
              >
                <Picker.Item label="수컷" value="수컷" />
                <Picker.Item label="암컷" value="암컷" />
              </Picker>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>키운 기간</Text>
              <Picker
                selectedValue={petExperience}
                onValueChange={setPetExperience}
                style={styles.picker}
              >
                <Picker.Item label="1년 미만" value="1년 미만" />
                <Picker.Item label="1~3년" value="1~3년" />
                <Picker.Item label="3년 이상" value="3년 이상" />
              </Picker>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>하루 산책 시간</Text>
              <Picker
                selectedValue={walkTime}
                onValueChange={setWalkTime}
                style={styles.picker}
              >
                <Picker.Item label="15분 이하" value="15분 이하" />
                <Picker.Item label="15~30분" value="15~30분" />
                <Picker.Item label="30분 이상" value="30분 이상" />
              </Picker>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>보험 가입 여부</Text>
              <Picker
                selectedValue={hasInsurance}
                onValueChange={setHasInsurance}
                style={styles.picker}
              >
                <Picker.Item label="예" value="예" />
                <Picker.Item label="아니오" value="아니오" />
              </Picker>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>입양 경로</Text>
              <Picker
                selectedValue={adoptionRoute}
                onValueChange={setAdoptionRoute}
                style={styles.picker}
              >
                <Picker.Item label="펫샵" value="펫샵" />
                <Picker.Item label="입양" value="입양" />
                <Picker.Item label="지인" value="지인" />
                <Picker.Item label="직접 구조" value="직접 구조" />
                <Picker.Item label="기타" value="기타" />
              </Picker>
            </View>

            <Button title="저장" onPress={handleSaveProfile} />
            <Button title="취소" onPress={() => setIsEditing(false)} />
          </ScrollView>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: 320,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  inputRow: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
  },
  picker: {
    width: '100%',
  },
});
