import React, { useState } from 'react';
import { ScrollView, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, setDoc } from "firebase/firestore";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [petType, setPetType] = useState('개');
  const [petExperience, setPetExperience] = useState('1년 미만');
  const [walkTime, setWalkTime] = useState('15분 이하');
  const [petGender, setPetGender] = useState('수컷');
  const [hasInsurance, setHasInsurance] = useState('예');
  const [adoptionRoute, setAdoptionRoute] = useState('펫샵');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        petType: petType,
        petExperience: petExperience,
        walkTime: walkTime,
        petGender: petGender,
        hasInsurance: hasInsurance,
        adoptionRoute: adoptionRoute,
        createdAt: new Date()
      });

      Alert.alert("회원가입 성공", "회원가입이 완료되었습니다.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("회원가입 오류:", error.message);
      Alert.alert("회원가입 실패", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      <Text style={styles.label}>반려동물 종류</Text>
      <Picker selectedValue={petType} onValueChange={setPetType} style={styles.picker}>
        <Picker.Item label="개" value="개" />
        <Picker.Item label="고양이" value="고양이" />
        <Picker.Item label="기타" value="기타" />
        <Picker.Item label="없음" value="없음" />
      </Picker>

      <Text style={styles.label}>반려동물 성별</Text>
      <Picker selectedValue={petGender} onValueChange={setPetGender} style={styles.picker}>
        <Picker.Item label="수컷" value="수컷" />
        <Picker.Item label="암컷" value="암컷" />
      </Picker>

      <Text style={styles.label}>반려동물 키운 기간</Text>
      <Picker selectedValue={petExperience} onValueChange={setPetExperience} style={styles.picker}>
        <Picker.Item label="1년 미만" value="1년 미만" />
        <Picker.Item label="1~3년" value="1~3년" />
        <Picker.Item label="3년 이상" value="3년 이상" />
      </Picker>

      <Text style={styles.label}>하루 평균 산책 시간</Text>
      <Picker selectedValue={walkTime} onValueChange={setWalkTime} style={styles.picker}>
        <Picker.Item label="15분 이하" value="15분 이하" />
        <Picker.Item label="15~30분" value="15~30분" />
        <Picker.Item label="30분 이상" value="30분 이상" />
      </Picker>

      <Text style={styles.label}>반려동물 보험 가입 여부</Text>
      <Picker selectedValue={hasInsurance} onValueChange={setHasInsurance} style={styles.picker}>
        <Picker.Item label="예" value="예" />
        <Picker.Item label="아니오" value="아니오" />
      </Picker>

      <Text style={styles.label}>입양 경로</Text>
      <Picker selectedValue={adoptionRoute} onValueChange={setAdoptionRoute} style={styles.picker}>
        <Picker.Item label="펫샵" value="펫샵" />
        <Picker.Item label="입양" value="입양" />
        <Picker.Item label="지인" value="지인" />
        <Picker.Item label="직접 구조" value="직접 구조" />
        <Picker.Item label="기타" value="기타" />
      </Picker>

      <Button title="회원가입" onPress={handleSignup} />
      <Text onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
        로그인
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  input: {
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4
  },
  picker: {
    marginBottom: 15
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold'
  },
  loginLink: {
    color: "blue",
    marginTop: 10,
    textAlign: 'center'
  }
});

export default SignUpScreen;
