import React, { useEffect, useState } from "react";
import { Image } from "react-native";

import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";

const BoardScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  // sortType: "latest" | "popular" | "recommended"
  const [sortType, setSortType] = useState("latest");

  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, searchText, sortType]);

  const applyFilters = () => {
    let updatedPosts = [...posts];

    if (searchText) {
      updatedPosts = updatedPosts.filter((post) =>
        post.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    switch (sortType) {
      case "popular":
        // 조회수 높은 순
        updatedPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "recommended":
        // 추천수 높은 순
        updatedPosts.sort(
          (a, b) =>
            (b.recommendedBy?.length || 0) - (a.recommendedBy?.length || 0)
        );
        break;
      case "latest":
      default:
        // 최신순
        updatedPosts.sort((a, b) => {
          const timeB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt).getTime();
          const timeA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt).getTime();
          return timeB - timeA;
        });
        break;
    }

    setFilteredPosts(updatedPosts);
  };

  const handleSearch = (text) => {
    setSearchText(text);
  };

  const handleWritePress = () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("로그인 필요", "로그인이 되어 있지 않습니다.");
      return;
    }
    navigation.navigate("게시글 작성");
  };

  const handlePostPress = async (post) => {
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        views: increment(1),
      });
      navigation.navigate("게시글 상세", { post: { ...post, views: (post.views || 0) + 1 } });
    } catch (error) {
      
      navigation.navigate("게시글 상세", { post });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="제목 검색..."
        value={searchText}
        onChangeText={handleSearch}
      />

      <View style={styles.sortButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortType === "latest" && styles.activeSortButton,
          ]}
          onPress={() => setSortType("latest")}
        >
          <Text style={[styles.sortButtonText, sortType === "latest" && styles.activeSortButtonText]}>
            최신순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortType === "popular" && styles.activeSortButton,
          ]}
          onPress={() => setSortType("popular")}
        >
          <Text style={[styles.sortButtonText, sortType === "popular" && styles.activeSortButtonText]}>
            인기순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortType === "recommended" && styles.activeSortButton,
          ]}
          onPress={() => setSortType("recommended")}
        >
          <Text style={[styles.sortButtonText, sortType === "recommended" && styles.activeSortButtonText]}>
            추천순
          </Text>
        </TouchableOpacity>
      </View>

      <Button title="글쓰기" onPress={handleWritePress} />

      <FlatList
  data={filteredPosts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)}>
      <View style={styles.postRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail} />
        )}
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postRecommendations}>
            추천 수: {item.recommendedBy?.length || 0}
          </Text>
          <Text style={styles.postViews}>조회수: {item.views || 0}</Text>
          <Text style={styles.postAuthor}>
            작성자: {item.authorEmail || "익명"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )}
/>

        
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    paddingLeft: 8,
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  activeSortButton: {
    backgroundColor: "#2196F3",
  },
  sortButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  activeSortButtonText: {
    color: "#fff",
  },
  post: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  postTitle: { fontSize: 18, fontWeight: "bold" },
  postRecommendations: { color: "#888", marginTop: 4 },
  postViews: { color: "#888", marginTop: 2 },
  postAuthor: { fontSize: 14, color: "#555", marginTop: 4 },
  postRow: {
  flexDirection: "row",
  marginBottom: 16,
  backgroundColor: "#fff",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#ddd",
  padding: 8,
  alignItems: "center",
},
thumbnail: {
  width: 60,
  height: 60,
  borderRadius: 6,
  marginRight: 12,
},
placeholderThumbnail: {
  width: 60,
  height: 60,
  borderRadius: 6,
  marginRight: 12,
  backgroundColor: "#ddd",
},
postContent: {
  flex: 1,
},

});

export default BoardScreen;
