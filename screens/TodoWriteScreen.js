import { Text, View, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import React, { useState } from 'react';

export default function TodoWriteScreen({ navigation }) {
  const [todo, setTodo] = useState('');

  const handleAddTodo = () => {
    if (!todo.trim()) {
      Alert.alert("할 일을 입력해주세요.");
      return;
    }
    navigation.navigate('활동일지', { todo }); // TodoListScreen으로 데이터 전달
  };

  const handleCancel = () => {
    setTodo('');
    navigation.goBack(); // 이전 화면으로 이동
  };

  return (
    <View style={styles.container}>
      <TextInput
        multiline
        onChangeText={setTodo}
        value={todo}
        placeholder="활동 내용을 기록해주세요 :)"
        style={styles.textInput}
      />
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleAddTodo} style={styles.button}>
          <Text style={styles.buttonText}>작성</Text>
        </Pressable>
        <Pressable onPress={handleCancel} style={[styles.button, styles.cancelButton]}>
          <Text style={styles.buttonText}>취소</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  textInput: {
    width: '100%',
    height: 300, // 15줄 정도 크기
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
