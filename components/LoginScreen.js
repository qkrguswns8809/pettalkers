import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase-config";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("로그인 성공:", userCredential.user);
      Alert.alert("로그인 성공", "환영합니다!");
      navigation.navigate("마이페이지"); // ✅ MyPageScreen으로 이동하도록 수정
    } catch (error) {
      console.error("로그인 오류:", error.message);
      Alert.alert("로그인 실패", error.message);
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
        style={{ marginBottom: 20, padding: 8, borderWidth: 1, borderRadius: 4 }}
      />
      <Button title="로그인" onPress={handleLogin} />
      <Text onPress={() => navigation.navigate("SignUp")} style={{ color: "blue", marginTop: 10 }}>
        회원가입
      </Text>
    </View>
  );
};

export default LoginScreen;
