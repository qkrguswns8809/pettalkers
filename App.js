import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

// 페이지 import
import TodoListScreen from './screens/TodoListScreen';
import TodoWriteScreen from './screens/TodoWriteScreen';
import MyPageScreen from './screens/MyPageScreen';
import HomeScreen from './screens/HomeScreen';
import ButlerScreen from './screens/ButlerScreen';
import GameScreen from './screens/GameScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import BoardScreen from './writescreens/BoardScreen';
import WriteScreen from './writescreens/WriteScreen';
import PostDetailScreen from './writescreens/PostDetailScreen';
import map from './screens/map';
import WeatherScreen from './screens/WeatherScreen'; // Weather.js 추가
import MyProfile from './screens/MyProfile'; // MyProfile import
import GPTChatScreen from "./functions/gpt"; // 변경


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 홈 네비게이션 (게임 화면 포함)
const HomeStackScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ title: "게임 화면" }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: "날씨 화면" }} />
      <Stack.Screen name="Chat" component={ChatRoomScreen} options={{ title: "실시간 채팅" }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: "채팅방" }} />
      <Stack.Screen name="GPTChat" component={GPTChatScreen} options={{ title: "챗봇" }} />

    </Stack.Navigator>
  );
};

// 활동일지 네비게이션
function TodoStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="활동일지" component={TodoListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="활동일지쓰기" component={TodoWriteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="집사정보" component={ButlerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// 마이페이지 네비게이션
function MyPageStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="마이페이지" component={MyPageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="집사정보" component={ButlerScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MyProfile"
        component={MyProfile}  // MyProfile 컴포넌트 추가
        options={{ title: "내 프로필", headerTitleAlign: 'center' }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// 게시판 네비게이션
function BoardStackScreen({ posts, setPosts }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="게시판">
        {props => <BoardScreen {...props} posts={posts} setPosts={setPosts} />}
      </Stack.Screen>
      <Stack.Screen name="게시글 작성">
        {props => <WriteScreen {...props} posts={posts} setPosts={setPosts} />}
      </Stack.Screen>
      <Stack.Screen name="게시글 상세">
        {props => <PostDetailScreen {...props} posts={posts} setPosts={setPosts} />}
      </Stack.Screen>
      <Stack.Screen name="게시글 수정">
        {props => <PostDetailScreen {...props} posts={posts} setPosts={setPosts} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

const App = () => {
  const [posts, setPosts] = useState([]);

  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="HomeStack">
  <Tab.Screen
    name="활동일지"
    component={TodoStackScreen}
    options={{
      title: '활동일지',
      headerTitleAlign: 'center',
      tabBarIcon: ({ focused }) => (
        <Entypo name="open-book" size={24} color="black" />
      ),
    }}
  />

  <Tab.Screen
    name="게시판"
    component={() => <BoardStackScreen posts={posts} setPosts={setPosts} />}
    options={{
      title: '게시판',
      headerTitleAlign: 'center',
      tabBarIcon: ({ focused }) => (
        <FontAwesome6 name="clipboard-list" size={24} color="black" />
      ),
    }}
  />

  <Tab.Screen
    name="HomeStack"
    component={HomeStackScreen}
    options={{
      title: '메인 홈',
      headerTitleAlign: 'center',
      tabBarIcon: ({ focused }) => (
        <AntDesign name="home" size={24} color="black" />
      ),
    }}
  />

  <Tab.Screen
    name="map"
    component={map}
    options={{
      title: '동물병원지도',
      headerTitleAlign: 'center',
      tabBarIcon: ({ focused }) => (
        <FontAwesome5 name="hospital" size={24} color="black" />
      ),
    }}
  />

  <Tab.Screen
    name="내정보"
    component={MyPageStackScreen}
    options={{
      title: '마이 페이지',
      headerTitleAlign: 'center',
      tabBarIcon: ({ focused }) => (
        <FontAwesome6 name="circle-user" size={24} color="black" />
      ),
    }}
  />
</Tab.Navigator>

    </NavigationContainer>
  );
};

export default App;
