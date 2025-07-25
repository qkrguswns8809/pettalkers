import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db, storage } from '../firebase-config';
import { collection, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const WriteScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');

  // ✅ 이미지 선택 함수
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ✅ Firestore에서 포인트 100점 증가
  const increaseUserPoints = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        points: increment(100), // ✅ 포인트 100점 증가
      });
    } catch (error) {
      console.error('포인트 업데이트 오류:', error);
    }
  };

  // ✅ 게시글 저장 함수 (이미지 업로드 포함)
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 입력하세요.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }

    setLoading(true);

    let imageUrl = '';
    if (image) {
      try {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `images/${Date.now()}_${user.email}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      } catch (error) {
        setLoading(false);
        Alert.alert('오류', '이미지를 업로드하는 중 문제가 발생했습니다.');
        console.error(error);
        return;
      }
    }

    const newPost = {
      title,
      content,
      category, 
      imageUrl,
      recommendations: 0,
      recommendedBy: [],
      comments: [],
      authorEmail: user.email,
      createdAt: new Date().getTime(),
    };

    try {
      await addDoc(collection(db, 'posts'), newPost);
      await increaseUserPoints(user.uid); // ✅ 게시글 저장 후 포인트 증가

      Alert.alert('작성 완료', '게시글이 성공적으로 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.navigate('게시판'),
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '게시글을 저장하는 중 문제가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>제목</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="제목을 입력하세요" />

      <Text style={styles.label}>내용</Text>
      <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="내용을 입력하세요" multiline />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>이미지 선택</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.previewImage} />}

<Text style={styles.label}>카테고리</Text>
<View style={styles.categoryContainer}>
  {['개', '고양이', '기타'].map((cat) => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryButton,
        category === cat && styles.categoryButtonSelected,
      ]}
      onPress={() => setCategory(cat)}
    >
      <Text style={category === cat ? styles.categoryTextSelected : styles.categoryText}>
        {cat}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" />
      ) : (
        <Button title="작성 완료" onPress={handleSubmit} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 },
  textArea: { height: 100 },
  imagePicker: { backgroundColor: '#ddd', padding: 10, alignItems: 'center', marginBottom: 10 },
  imagePickerText: { color: '#333' },
  previewImage: { width: '100%', height: 200, marginBottom: 10, borderRadius: 8 },
  categoryContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 16,
},
categoryButton: {
  padding: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 20,
},
categoryButtonSelected: {
  backgroundColor: '#1a73e8',
  borderColor: '#1a73e8',
},
categoryText: {
  color: '#333',
},
categoryTextSelected: {
  color: '#fff',
},
});

export default WriteScreen;
