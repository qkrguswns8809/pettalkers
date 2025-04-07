import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase-config';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const BoardScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = posts.filter(post => post.title.includes(text));
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  };

  const handleWritePress = () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 되어 있지 않습니다.');
      return;
    }
    navigation.navigate('게시글 작성');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="제목 검색..."
        value={searchText}
        onChangeText={handleSearch}
      />
      <Button title="글쓰기" onPress={handleWritePress} />
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('게시글 상세', { post: item })}>
            <View style={styles.post}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postRecommendations}>추천 수: {item.recommendations?.length || 0}</Text>
              <Text style={styles.postAuthor}>작성자: {item.authorEmail || '익명'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  searchInput: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 8, paddingLeft: 8 },
  post: { marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  postTitle: { fontSize: 18, fontWeight: 'bold' },
  postRecommendations: { color: '#888' },
  postAuthor: { fontSize: 14, color: '#555', marginTop: 4 },
});

export default BoardScreen;
