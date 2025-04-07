import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Modal } from 'react-native';
import { auth, db } from '../firebase-config';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function ButlerScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const petsRef = collection(db, `users/${user.uid}/pets`);
    const unsubscribe = onSnapshot(petsRef, (snapshot) => {
      const fetchedPets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPets(fetchedPets);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPet = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }

    if (!petName || !petBreed) {
      Alert.alert('입력 필요', '반려동물 이름과 종을 입력하세요.');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/pets`), {
        name: petName,
        breed: petBreed,
      });
      setPetName('');
      setPetBreed('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('에러', '반려동물을 추가하는 중 문제가 발생했습니다.');
    }
  };

  const handleDeletePet = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/pets`, id));
    } catch (error) {
      Alert.alert('에러', '삭제하는 중 문제가 발생했습니다.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Pressable
          style={[styles.button, styles.buttonOpen]}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.textStyle}>반려동물 추가하기</Text>
        </Pressable>

        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.petBox}>
              <Text style={styles.petText}>{item.name} ({item.breed})</Text>
              <Pressable style={styles.deleteButton} onPress={() => handleDeletePet(item.id)}>
                <Text style={styles.textStyle}>삭제</Text>
              </Pressable>
            </View>
          )}
        />

        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.header}>반려동물 정보</Text>
              <TextInput placeholder='반려동물 이름' style={styles.textInput} value={petName} onChangeText={setPetName} />
              <TextInput placeholder='종 종류' style={styles.textInput} value={petBreed} onChangeText={setPetBreed} />
              <Pressable style={[styles.button, styles.buttonClose]} onPress={handleAddPet}>
                <Text style={styles.textStyle}>반려동물 추가하기</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>취소</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  textInput: { borderColor: '#000', borderBottomWidth: 1, marginBottom: 16, width: 300, padding: 5 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: 350, backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
  button: { borderRadius: 10, padding: 10, marginTop: 10, alignItems: 'center' },
  buttonOpen: { backgroundColor: '#F194FF', width: '100%' },
  buttonClose: { backgroundColor: '#2196F3', width: '100%' },
  buttonCancel: { backgroundColor: '#888', width: '100%' },
  deleteButton: { backgroundColor: '#FF3B30', borderRadius: 10, padding: 10, marginTop: 10 },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  petBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginVertical: 5, width: 350, borderWidth: 1, borderColor: '#ddd' },
  petText: { fontSize: 16, fontWeight: 'bold' },
});
