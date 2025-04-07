import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { collection, query, onSnapshot, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';

const TodoListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [todos, setTodos] = useState([]); // 할 일 목록 상태

  // Firestore에서 할 일 목록 불러오는 함수
  const fetchTodos = () => {
    const todosRef = collection(db, 'todos');
    const q = query(todosRef, orderBy('createdAt', 'desc')); // 작성 날짜 기준으로 내림차순 정렬

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTodos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodos(fetchedTodos); // 실시간으로 할 일 목록 업데이트
    });

    return unsubscribe;
  };

  // 화면이 처음 로드될 때 할 일 목록 불러오기
  useEffect(() => {
    const unsubscribe = fetchTodos();
    return () => unsubscribe(); // 컴포넌트가 언마운트될 때 구독 해제
  }, []);

  // 로그인이 될 때마다 할 일 목록 업데이트
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 로그인되었을 때 할 일 목록 가져오기
        fetchTodos();
      } else {
        // 로그아웃되었을 때 할 일 목록 초기화
        setTodos([]);
      }
    });

    return () => unsubscribeAuth(); // 컴포넌트가 언마운트될 때 구독 해제
  }, []);

  // 새 할 일 추가
  useEffect(() => {
    if (route.params?.todo) {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
        return;
      }

      const newTodo = {
        text: route.params.todo,
        authorEmail: user.email,
        createdAt: new Date(),
      };

      // Firestore에 새 할 일 추가
      addDoc(collection(db, 'todos'), newTodo)
        .then(() => {
          Alert.alert('할 일이 추가되었습니다.');
        })
        .catch((error) => {
          Alert.alert('오류 발생', error.message);
        });
    }
  }, [route.params?.todo]);

  // 할 일 삭제 함수
  const handleDelete = (todoId, authorEmail) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }

    if (user.email !== authorEmail) {
      Alert.alert('권한 오류', '삭제할 권한이 없습니다.');
      return;
    }

    const todoDoc = doc(db, 'todos', todoId);
    deleteDoc(todoDoc)
      .then(() => {
        Alert.alert('삭제 완료', '할 일이 삭제되었습니다.');
      })
      .catch((error) => {
        Alert.alert('오류 발생', error.message);
      });
  };

  // 로그인된 사용자만 게시글을 볼 수 있도록 필터링
  const filteredTodos = todos.filter((todo) => todo.authorEmail === auth.currentUser?.email);

  return (
    <View style={styles.container}>
      <Button title="글쓰기" onPress={() => navigation.navigate('활동일지쓰기')} />
      <FlatList
        data={filteredTodos} // 로그인된 사용자만 볼 수 있는 게시글 목록
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.postTitle}>{item.text}</Text>
            <Text style={styles.postAuthor}>작성자: {item.authorEmail || '익명'}</Text>
            <Text style={styles.postDate}>작성일: {new Date(item.createdAt.seconds * 1000).toLocaleString()}</Text>
            <Button
              title="삭제"
              color="red"
              onPress={() => handleDelete(item.id, item.authorEmail)}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  post: { marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  postTitle: { fontSize: 18, fontWeight: 'bold' },
  postAuthor: { fontSize: 14, color: '#555' },
  postDate: { fontSize: 12, color: 'gray', marginTop: 4 },
});

export default TodoListScreen;
