import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { auth, db } from '../firebase-config';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot } from 'firebase/firestore';

const PostDetailScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const [currentPost, setCurrentPost] = useState(post);
  const [commentText, setCommentText] = useState('');
  const [hasUserRecommended, setHasUserRecommended] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const postData = snapshot.data();
        setCurrentPost({ id: snapshot.id, ...postData });

        // 추천 여부 확인
        setHasUserRecommended(postData.recommendedBy?.includes(user?.email) || false);
      } else {
        navigation.goBack();
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ 게시글 삭제 기능
  const handleDeletePost = async () => {
    if (!user || user.email !== currentPost.authorEmail) return;

    Alert.alert('게시글 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        onPress: async () => {
          await deleteDoc(doc(db, 'posts', currentPost.id));
          navigation.replace('게시판'); // 삭제 후 게시판으로 이동
        },
      },
    ]);
  };

  // ✅ 추천 버튼 클릭 처리
  const handleRecommend = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }

    const postRef = doc(db, 'posts', currentPost.id);

    if (!hasUserRecommended) {
      // 추천 추가
      await updateDoc(postRef, {
        recommendedBy: arrayUnion(user.email),
      });
    } else {
      // 추천 취소
      await updateDoc(postRef, {
        recommendedBy: arrayRemove(user.email),
      });
    }
  };
  const handleAddComment = async () => {
  if (!commentText.trim()) return;

  const newComment = {
    id: Date.now().toString(), // 간단한 고유 ID
    text: commentText,
    authorEmail: user?.email || '익명',
  };

  const postRef = doc(db, 'posts', currentPost.id);

  try {
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });

    setCommentText(''); // 입력창 초기화
  } catch (error) {
    console.error('댓글 추가 실패:', error);
    Alert.alert('오류', '댓글을 추가하는 도중 문제가 발생했습니다.');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentPost.title} <Text style={styles.author}>({currentPost.authorEmail})</Text></Text>
      
      {currentPost.imageUrl && <Image source={{ uri: currentPost.imageUrl }} style={styles.postImage} />}
      
      <Text style={styles.content}>{currentPost.content}</Text>

      {/* 삭제 버튼 (작성자만 가능) */}
      {user?.email === currentPost.authorEmail && (
        <TouchableOpacity onPress={handleDeletePost} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>게시글 삭제</Text>
        </TouchableOpacity>
      )}

      {/* 추천 버튼 */}
      <TouchableOpacity onPress={handleRecommend} style={[styles.recommendButton, hasUserRecommended && styles.recommended]}>
        <Text style={styles.recommendButtonText}>{hasUserRecommended ? '추천 취소' : '추천'}</Text>
      </TouchableOpacity>

      {/* 추천 수 표시 */}
      <Text style={styles.recommendations}>추천 수: {currentPost.recommendedBy?.length || 0}</Text>

      <Text style={styles.label}>댓글</Text>
      <FlatList
        data={currentPost.comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.commentAuthor}>{item.authorEmail}:</Text>
            <Text>{item.text}</Text>
          </View>
        )}
      />

      <TextInput style={styles.input} value={commentText} onChangeText={setCommentText} placeholder="댓글을 입력하세요" />
      <Button title="댓글 추가" onPress={handleAddComment} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  author: { fontSize: 16, color: '#666' },
  content: { fontSize: 16, marginBottom: 16 },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  deleteButton: { backgroundColor: 'red', padding: 8, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  recommendButton: { backgroundColor: '#1a73e8', padding: 8, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  recommended: { backgroundColor: '#ff9800' }, // 추천된 상태일 때 색상 변경
  recommendButtonText: { color: '#fff', fontWeight: 'bold' },
  recommendations: { fontSize: 16, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 },
  comment: { padding: 8, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ddd' },
  commentAuthor: { fontWeight: 'bold', marginBottom: 4 },
});

export default PostDetailScreen;
