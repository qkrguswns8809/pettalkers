import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { auth, db } from '../firebase-config';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const ChatRoomsScreen = ({ navigation }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const unsubscribe = onSnapshot(chatRoomsRef, (snapshot) => {
      setChatRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const createChatRoom = async () => {
    if (!roomName.trim()) return;
    try {
      await addDoc(collection(db, 'chatRooms'), {
        name: roomName,
        createdBy: user.email,
      });
      setRoomName('');
    } catch (error) {
      Alert.alert('오류', '채팅방을 생성하는 중 문제가 발생했습니다.');
    }
  };

  const deleteChatRoom = async (roomId, createdBy) => {
    if (user.email !== createdBy) {
      Alert.alert('삭제 불가', '본인이 만든 채팅방만 삭제할 수 있습니다.');
      return;
    }
    Alert.alert('채팅방 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        onPress: async () => {
          await deleteDoc(doc(db, 'chatRooms', roomId));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅방 선택</Text>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.roomContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatScreen', { chatRoomId: item.id })}>
              <Text style={styles.roomName}>{item.name}</Text>
            </TouchableOpacity>
            {user.email === item.createdBy && (
              <TouchableOpacity onPress={() => deleteChatRoom(item.id, item.createdBy)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      <TextInput style={styles.input} value={roomName} onChangeText={setRoomName} placeholder="채팅방 이름 입력" />
      <Button title="채팅방 만들기" onPress={createChatRoom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 },
  roomContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  roomName: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: 'red', padding: 5, borderRadius: 5 },
  deleteButtonText: { color: '#fff' },
});

export default ChatRoomsScreen;
