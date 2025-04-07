import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const EditScreen = ({ route, navigation }) => {
  const { post, posts, setPosts } = route.params;
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);

  const handleUpdatePost = () => {
    const updatedPosts = posts.map((item) =>
      item.id === post.id ? { ...item, title, content } : item
    );
    setPosts(updatedPosts);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>제목 수정</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>내용 수정</Text>
      <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} multiline />
      <Button title="수정 완료" onPress={handleUpdatePost} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 },
  textArea: { height: 100 },
});

export default EditScreen;