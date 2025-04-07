import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase-config"; // Firebase 설정 가져오기

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("회원가입 성공:", userCredential.user);
      Alert.alert("회원가입 성공", "회원가입이 완료되었습니다.");
      navigation.navigate("Login"); 
    } catch (error) {
      console.error("회원가입 오류:", error.message);
      Alert.alert("회원가입 실패", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 10, padding: 8, borderWidth: 1, borderRadius: 4 }}
      />
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 10, padding: 8, borderWidth: 1, borderRadius: 4 }}
      />
      <TextInput
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{ marginBottom: 20, padding: 8, borderWidth: 1, borderRadius: 4 }}
      />
      <Button title="회원가입" onPress={handleSignup} />
      <Text onPress={() => navigation.navigate("Login")} style={{ color: "blue", marginTop: 10 }}>
        로그인
      </Text>
    </View>
  );
};

export default SignUpScreen;
